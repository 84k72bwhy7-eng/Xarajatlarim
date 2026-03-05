from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, WebAppInfo, ReplyKeyboardMarkup, KeyboardButton
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from datetime import datetime
import database as db

router = Router()

class ExpenseStates(StatesGroup):
    waiting_for_amount = State()
    waiting_for_description = State()

def format_amount(amount):
    """Summani formatlash"""
    return f"{amount:,.0f}".replace(",", " ")

async def get_main_keyboard(pool, user_id):
    """Asosiy klaviatura: Kategoriyalar tugmalar ko'rinishida"""
    builder = ReplyKeyboardBuilder()
    
    # 1. Mini App tugmasi
    WEBAPP_URL = "https://frontend-production-a930.up.railway.app" 
    builder.button(text="🚀 Ilovani ochish", web_app=WebAppInfo(url=WEBAPP_URL))
    
    # 2. Foydalanuvchi kategoriyalari
    if pool:
        try:
            categories = await db.get_user_categories(pool, user_id)
            for cat in categories:
                btn_text = f"{cat['icon']} {cat['name']}"
                builder.button(text=btn_text)
        except Exception as e:
            print(f"Error fetching categories: {e}")
    
    builder.adjust(1, 2)
    return builder.as_markup(resize_keyboard=True)

@router.message(F.text.regexp(r'^[\U00010000-\U0010ffff] .+$'))
async def process_category_click(message: Message, state: FSMContext):
    """Kategoriya tugmasi bosilganda"""
    # Masalan: "🍔 Oziq-ovqat" -> "Oziq-ovqat"
    btn_text = message.text
    cat_name = btn_text.split(" ", 1)[1] if " " in btn_text else btn_text
    
    pool = message.bot.pool
    if not pool:
        await message.answer("❌ Ma'lumotlar bazasiga ulanishda xato. Iltimos, administratorga murojaat qiling.")
        return

    user = await db.get_user_by_tg_id(pool, message.from_user.id)
    
    if not user:
        await message.answer("Avval /start bosing.")
        return

    # Kategoriyalarni tekshirish
    categories = await db.get_user_categories(pool, user['id'])
    matched_cat = next((c for c in categories if c['name'] == cat_name), None)
    
    if not matched_cat:
        # Agar mos kelmasa (masalan emoji o'zgargan bo'lsa), oddiy matn sifatida qayta tekshiramiz
        matched_cat = next((c for c in categories if c['name'] in btn_text), None)

    if matched_cat:
        await state.update_data(
            user_id=user['id'],
            category_id=matched_cat['id'],
            category_name=matched_cat['name']
        )
        await message.answer(
            f"📂 Kategoriya: <b>{matched_cat['name']}</b>\n\n"
            "💵 <b>Xarajat miqdorini kiriting:</b>\n"
            "Masalan: <code>50000</code>",
            parse_mode="HTML"
        )
        await state.set_state(ExpenseStates.waiting_for_amount)
    else:
        await message.answer("Kategoriya topilmadi. Iltimos, tugmalardan birini tanlang.")

@router.message(ExpenseStates.waiting_for_amount)
async def process_amount(message: Message, state: FSMContext):
    """Miqdorni qayta ishlash"""
    text = message.text.replace(" ", "").replace(",", "").replace(".", "")
    try:
        amount = float(text)
        if amount <= 0:
            raise ValueError
    except ValueError:
        await message.answer("❌ Noto'g'ri miqdor! Faqat raqam kiriting (masalan: 50000).")
        return

    await state.update_data(amount=amount)
    await message.answer(
        f"✅ Miqdor: <b>{format_amount(amount)} so'm</b>\n\n"
        "📝 <b>Izoh kiriting</b> (ixtiyoriy):\n"
        "Yoki /skip bosing",
        parse_mode="HTML"
    )
    await state.set_state(ExpenseStates.waiting_for_description)

@router.message(ExpenseStates.waiting_for_description)
async def process_description(message: Message, state: FSMContext):
    """Xarajatni saqlash"""
    description = None if message.text == "/skip" else message.text
    data = await state.get_data()
    pool = message.bot.pool
    
    # Account olish (birinchisini ishlatamiz)
    accounts = await db.get_user_accounts(pool, data['user_id'])
    if not accounts:
        await message.answer("Sizda hisob (account) topilmadi. Ilovadan hisob oching.")
        await state.clear()
        return
        
    account = accounts[0]

    # DB ga saqlash
    await db.add_transaction_direct(
        pool=pool,
        user_id=data['user_id'],
        amount=data['amount'],
        category_id=data['category_id'],
        account_id=account['id'],
        description=description
    )

    # Tasdiqlash
    desc_text = f"\n📝 Izoh: {description}" if description else ""
    await message.answer(
        f"✅ <b>Xarajat saqlandi!</b>\n\n"
        f"💵 Miqdor: <b>{format_amount(data['amount'])} so'm</b>\n"
        f"📂 Kategoriya: <b>{data['category_name']}</b>"
        f"{desc_text}\n"
        f"📅 Sana: <b>{datetime.now().strftime('%d.%m.%Y')}</b>",
        parse_mode="HTML",
        reply_markup=await get_main_keyboard(pool, data['user_id'])
    )
    await state.clear()
