from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from datetime import datetime
import database as db

router = Router()


class ExpenseStates(StatesGroup):
    waiting_for_amount = State()
    waiting_for_category = State()
    waiting_for_description = State()
    waiting_for_date = State()


def format_amount(amount):
    """Summani formatlash"""
    return f"{amount:,.0f}".replace(",", " ")


def get_category_keyboard(categories):
    """Kategoriyalar klaviaturasi"""
    builder = InlineKeyboardBuilder()
    for i, cat in enumerate(categories):
        builder.button(text=cat, callback_data=f"cat:{cat}")
    builder.adjust(2)
    builder.button(text="❌ Bekor qilish", callback_data="cancel")
    builder.adjust(2, 1)
    return builder.as_markup()


def get_main_keyboard():
    """Asosiy klaviatura"""
    builder = ReplyKeyboardBuilder()
    builder.button(text="➕ Xarajat qo'shish")
    builder.button(text="📊 Hisobot")
    builder.button(text="📅 Bugungi xarajatlar")
    builder.button(text="📈 Oylik hisobot")
    builder.button(text="💰 Byudjet")
    builder.button(text="⚙️ Sozlamalar")
    builder.adjust(2, 2, 2)
    return builder.as_markup(resize_keyboard=True)


@router.message(Command("add"))
@router.message(F.text == "➕ Xarajat qo'shish")
async def add_expense_start(message: Message, state: FSMContext):
    """Xarajat qo'shishni boshlash"""
    user = db.get_or_create_user(
        message.from_user.id,
        message.from_user.first_name,
        message.from_user.username
    )
    await state.update_data(user_id=user['id'])
    await message.answer(
        "💵 <b>Xarajat miqdorini kiriting:</b>\n\n"
        "Masalan: <code>50000</code> yoki <code>150000</code>",
        parse_mode="HTML"
    )
    await state.set_state(ExpenseStates.waiting_for_amount)


@router.message(ExpenseStates.waiting_for_amount)
async def process_amount(message: Message, state: FSMContext):
    """Miqdorni qayta ishlash"""
    text = message.text.replace(" ", "").replace(",", "").replace(".", "")
    try:
        amount = float(text)
        if amount <= 0:
            raise ValueError
    except ValueError:
        await message.answer(
            "❌ Noto'g'ri miqdor! Iltimos, faqat raqam kiriting.\n"
            "Masalan: <code>50000</code>",
            parse_mode="HTML"
        )
        return

    data = await state.get_data()
    categories = db.get_user_categories(data['user_id'])
    await state.update_data(amount=amount)

    await message.answer(
        f"✅ Miqdor: <b>{format_amount(amount)} so'm</b>\n\n"
        "📂 <b>Kategoriyani tanlang:</b>",
        parse_mode="HTML",
        reply_markup=get_category_keyboard(categories)
    )
    await state.set_state(ExpenseStates.waiting_for_category)


@router.callback_query(F.data.startswith("cat:"), ExpenseStates.waiting_for_category)
async def process_category(callback: CallbackQuery, state: FSMContext):
    """Kategoriyani qayta ishlash"""
    category = callback.data.split(":", 1)[1]
    await state.update_data(category=category)

    await callback.message.edit_text(
        f"✅ Kategoriya: <b>{category}</b>\n\n"
        "📝 <b>Izoh kiriting</b> (ixtiyoriy):\n"
        "Yoki /skip bosing",
        parse_mode="HTML"
    )
    await state.set_state(ExpenseStates.waiting_for_description)


@router.callback_query(F.data == "cancel")
async def cancel_action(callback: CallbackQuery, state: FSMContext):
    """Bekor qilish"""
    await state.clear()
    await callback.message.edit_text("❌ Bekor qilindi.")
    await callback.message.answer("Asosiy menyu:", reply_markup=get_main_keyboard())


@router.message(ExpenseStates.waiting_for_description)
async def process_description(message: Message, state: FSMContext):
    """Izohni qayta ishlash"""
    description = None if message.text == "/skip" else message.text
    data = await state.get_data()

    # Xarajatni saqlash
    expense_id = db.add_expense(
        user_id=data['user_id'],
        amount=data['amount'],
        category=data['category'],
        description=description
    )

    # Tasdiqlash xabari
    desc_text = f"\n📝 Izoh: {description}" if description else ""
    await message.answer(
        f"✅ <b>Xarajat saqlandi!</b>\n\n"
        f"💵 Miqdor: <b>{format_amount(data['amount'])} so'm</b>\n"
        f"📂 Kategoriya: <b>{data['category']}</b>"
        f"{desc_text}\n"
        f"📅 Sana: <b>{datetime.now().strftime('%d.%m.%Y')}</b>",
        parse_mode="HTML",
        reply_markup=get_main_keyboard()
    )
    await state.clear()


@router.message(Command("today"))
@router.message(F.text == "📅 Bugungi xarajatlar")
async def today_expenses(message: Message):
    """Bugungi xarajatlar"""
    user = db.get_or_create_user(message.from_user.id, message.from_user.first_name)
    today = datetime.now()
    expenses = db.get_expenses(user['id'], month=today.month, year=today.year)

    # Faqat bugungi
    today_str = today.strftime('%Y-%m-%d')
    today_exp = [e for e in expenses if e['date'] == today_str]

    if not today_exp:
        await message.answer(
            "📅 <b>Bugun hech qanday xarajat yo'q!</b>",
            parse_mode="HTML"
        )
        return

    total = sum(e['amount'] for e in today_exp)
    text = f"📅 <b>Bugungi xarajatlar</b> ({today.strftime('%d.%m.%Y')})\n"
    text += "─" * 30 + "\n"

    for exp in today_exp[:10]:
        desc = f" - {exp['description']}" if exp['description'] else ""
        text += f"• {exp['category']}: <b>{format_amount(exp['amount'])} so'm</b>{desc}\n"

    text += "─" * 30 + "\n"
    text += f"💰 <b>Jami: {format_amount(total)} so'm</b>"

    await message.answer(text, parse_mode="HTML")


@router.message(F.text == "📊 Hisobot")
async def quick_report(message: Message):
    """Tezkor hisobot"""
    user = db.get_or_create_user(message.from_user.id, message.from_user.first_name)
    now = datetime.now()
    
    builder = InlineKeyboardBuilder()
    builder.button(text="📅 Bugun", callback_data="report:day")
    builder.button(text="📆 Bu oy", callback_data="report:month")
    builder.button(text="📊 Kategoriyalar", callback_data="report:category")
    builder.button(text="📋 So'nggi 10", callback_data="report:last10")
    builder.adjust(2, 2)
    
    await message.answer(
        "📊 <b>Hisobot turini tanlang:</b>",
        parse_mode="HTML",
        reply_markup=builder.as_markup()
    )


@router.callback_query(F.data.startswith("report:"))
async def handle_report(callback: CallbackQuery):
    """Hisobot ko'rsatish"""
    report_type = callback.data.split(":")[1]
    user = db.get_or_create_user(callback.from_user.id, callback.from_user.first_name)
    now = datetime.now()
    
    if report_type == "day":
        expenses = db.get_expenses(user['id'], month=now.month, year=now.year)
        today_str = now.strftime('%Y-%m-%d')
        expenses = [e for e in expenses if e['date'] == today_str]
        title = f"📅 Bugungi hisobot ({now.strftime('%d.%m.%Y')})"
    elif report_type == "month":
        expenses = db.get_expenses(user['id'], month=now.month, year=now.year)
        title = f"📆 {now.strftime('%B %Y')} oyi hisoboti"
    elif report_type == "last10":
        expenses = db.get_expenses(user['id'], limit=10)
        title = "📋 So'nggi 10 ta xarajat"
    else:
        await handle_category_report(callback, user, now)
        return

    if not expenses:
        await callback.message.edit_text("📭 Xarajatlar topilmadi.")
        return

    total = sum(e['amount'] for e in expenses)
    text = f"<b>{title}</b>\n"
    text += "─" * 30 + "\n"

    for exp in expenses[:15]:
        date_str = datetime.strptime(exp['date'], '%Y-%m-%d').strftime('%d.%m')
        desc = f" ({exp['description']})" if exp['description'] else ""
        text += f"• {date_str} | {exp['category']}: <b>{format_amount(exp['amount'])} so'm</b>{desc}\n"

    text += "─" * 30 + "\n"
    text += f"💰 <b>Jami: {format_amount(total)} so'm</b>"

    await callback.message.edit_text(text, parse_mode="HTML")


async def handle_category_report(callback, user, now):
    """Kategoriya bo'yicha hisobot"""
    cat_data = db.get_expenses_by_category(user['id'], month=now.month, year=now.year)
    
    if not cat_data:
        await callback.message.edit_text("📭 Bu oyda xarajatlar topilmadi.")
        return
    
    total = sum(c['total'] for c in cat_data)
    text = f"📊 <b>Kategoriyalar bo'yicha ({now.strftime('%B %Y')})</b>\n"
    text += "─" * 30 + "\n"
    
    for cat in cat_data:
        percent = (cat['total'] / total * 100) if total > 0 else 0
        bar_len = int(percent / 10)
        bar = "█" * bar_len + "░" * (10 - bar_len)
        text += f"{cat['category']}\n"
        text += f"  {bar} <b>{format_amount(cat['total'])} so'm</b> ({percent:.1f}%)\n"
    
    text += "─" * 30 + "\n"
    text += f"💰 <b>Jami: {format_amount(total)} so'm</b>"
    
    await callback.message.edit_text(text, parse_mode="HTML")
