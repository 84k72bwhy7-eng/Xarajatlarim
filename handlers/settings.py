from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.utils.keyboard import InlineKeyboardBuilder
import database as db

router = Router()


class BudgetStates(StatesGroup):
    waiting_for_amount = State()


class CategoryStates(StatesGroup):
    waiting_for_name = State()


def format_amount(amount):
    return f"{amount:,.0f}".replace(",", " ")


@router.message(Command("budget"))
@router.message(F.text == "💰 Byudjet")
async def budget_menu(message: Message):
    """Byudjet menyu"""
    user = db.get_or_create_user(message.from_user.id, message.from_user.first_name)
    from datetime import datetime
    now = datetime.now()

    budgets = db.get_budget(user['id'], now.month, now.year)
    total_spent = db.get_total_expenses(user['id'], now.month, now.year)

    total_budget = sum(b['amount'] for b in budgets if b['category'] is None)

    builder = InlineKeyboardBuilder()
    builder.button(text="➕ Oylik byudjet belgilash", callback_data="budget:set")
    builder.adjust(1)

    text = f"💰 <b>Byudjet - {now.strftime('%B %Y')}</b>\n"
    text += "─" * 30 + "\n"

    if total_budget:
        remaining = total_budget - total_spent
        percent = (total_spent / total_budget * 100) if total_budget > 0 else 0
        bar_len = min(int(percent / 10), 10)
        bar = "█" * bar_len + "░" * (10 - bar_len)
        status = "✅" if remaining >= 0 else "⚠️"

        text += f"{status} Byudjet: <b>{format_amount(total_budget)} so'm</b>\n"
        text += f"💸 Sarflangan: <b>{format_amount(total_spent)} so'm</b>\n"
        text += f"💚 Qolgan: <b>{format_amount(remaining)} so'm</b>\n"
        text += f"📊 {bar} {percent:.1f}%\n"
    else:
        text += "❌ Byudjet belgilanmagan\n"
        text += f"💸 Bu oy sarflangan: <b>{format_amount(total_spent)} so'm</b>\n"

    await message.answer(text, parse_mode="HTML", reply_markup=builder.as_markup())


@router.callback_query(F.data == "budget:set")
async def set_budget_start(callback: CallbackQuery, state: FSMContext):
    """Byudjet belgilashni boshlash"""
    user = db.get_or_create_user(callback.from_user.id, callback.from_user.first_name)
    await state.update_data(user_id=user['id'])
    await callback.message.edit_text(
        "💰 <b>Oylik byudjet miqdorini kiriting:</b>\n\n"
        "Masalan: <code>3000000</code>",
        parse_mode="HTML"
    )
    await state.set_state(BudgetStates.waiting_for_amount)


@router.message(BudgetStates.waiting_for_amount)
async def process_budget_amount(message: Message, state: FSMContext):
    """Byudjet miqdorini saqlash"""
    text = message.text.replace(" ", "").replace(",", "")
    try:
        amount = float(text)
        if amount <= 0:
            raise ValueError
    except ValueError:
        await message.answer("❌ Noto'g'ri miqdor! Raqam kiriting.")
        return

    data = await state.get_data()
    from datetime import datetime
    now = datetime.now()
    db.set_budget(data['user_id'], amount, category=None, month=now.month, year=now.year)

    await message.answer(
        f"✅ <b>Byudjet belgilandi!</b>\n\n"
        f"💰 Oylik byudjet: <b>{format_amount(amount)} so'm</b>",
        parse_mode="HTML"
    )
    await state.clear()


@router.message(Command("settings"))
@router.message(F.text == "⚙️ Sozlamalar")
async def settings_menu(message: Message):
    """Sozlamalar menyu"""
    builder = InlineKeyboardBuilder()
    builder.button(text="📂 Kategoriyalarni ko'rish", callback_data="settings:categories")
    builder.button(text="➕ Yangi kategoriya", callback_data="settings:add_category")
    builder.adjust(1)

    await message.answer(
        "⚙️ <b>Sozlamalar</b>",
        parse_mode="HTML",
        reply_markup=builder.as_markup()
    )


@router.callback_query(F.data == "settings:categories")
async def show_categories(callback: CallbackQuery):
    """Kategoriyalarni ko'rsatish"""
    user = db.get_or_create_user(callback.from_user.id, callback.from_user.first_name)
    categories = db.get_user_categories(user['id'])

    text = "📂 <b>Sizning kategoriyalaringiz:</b>\n\n"
    for i, cat in enumerate(categories, 1):
        text += f"{i}. {cat}\n"

    await callback.message.edit_text(text, parse_mode="HTML")


@router.callback_query(F.data == "settings:add_category")
async def add_category_start(callback: CallbackQuery, state: FSMContext):
    """Yangi kategoriya qo'shish"""
    user = db.get_or_create_user(callback.from_user.id, callback.from_user.first_name)
    await state.update_data(user_id=user['id'])
    await callback.message.edit_text(
        "➕ <b>Yangi kategoriya nomini kiriting:</b>\n\n"
        "Masalan: <code>🏥 Shifoxona</code>",
        parse_mode="HTML"
    )
    await state.set_state(CategoryStates.waiting_for_name)


@router.message(CategoryStates.waiting_for_name)
async def process_category_name(message: Message, state: FSMContext):
    """Kategoriya nomini saqlash"""
    data = await state.get_data()
    name = message.text.strip()

    if len(name) < 2:
        await message.answer("❌ Kategoriya nomi juda qisqa!")
        return

    success = db.add_category(data['user_id'], name)
    if success:
        await message.answer(f"✅ <b>'{name}'</b> kategoriyasi qo'shildi!", parse_mode="HTML")
    else:
        await message.answer("❌ Bu kategoriya allaqachon mavjud!")
    await state.clear()
