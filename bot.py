import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.types import Message, BotCommand
from aiogram.filters import CommandStart
from aiogram.fsm.storage.memory import MemoryStorage
from config import BOT_TOKEN
import database as db
from handlers.expense import router as expense_router, get_main_keyboard
from handlers.settings import router as settings_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# Routerlarni qo'shish
dp.include_router(expense_router)
dp.include_router(settings_router)


@dp.message(CommandStart())
async def start_handler(message: Message):
    """Start buyrug'i"""
    user = db.get_or_create_user(
        message.from_user.id,
        message.from_user.first_name,
        message.from_user.username
    )

    welcome_text = (
        f"👋 Salom, <b>{message.from_user.first_name}</b>!\n\n"
        "💰 <b>Xarajatlarim</b> botiga xush kelibsiz!\n\n"
        "Bu bot sizga kundalik xarajatlaringizni:\n"
        "✅ Qayd etishga\n"
        "✅ Kategoriyalashga\n"
        "✅ Statistika ko'rishga\n"
        "✅ Byudjet belgilashga yordam beradi!\n\n"
        "Quyidagi tugmalardan foydalaning:"
    )

    await message.answer(
        welcome_text,
        parse_mode="HTML",
        reply_markup=get_main_keyboard()
    )


@dp.message(CommandStart(deep_link=True))
async def start_with_ref(message: Message):
    await start_handler(message)


async def set_commands():
    """Bot buyruqlarini o'rnatish"""
    commands = [
        BotCommand(command="start", description="🏠 Bosh sahifa"),
        BotCommand(command="add", description="➕ Xarajat qo'shish"),
        BotCommand(command="today", description="📅 Bugungi xarajatlar"),
        BotCommand(command="budget", description="💰 Byudjet"),
        BotCommand(command="settings", description="⚙️ Sozlamalar"),
    ]
    await bot.set_my_commands(commands)


async def main():
    """Asosiy funksiya"""
    logger.info("🤖 Bot ishga tushmoqda...")
    
    # Ma'lumotlar bazasini ishga tushirish
    db.init_db()
    logger.info("✅ Ma'lumotlar bazasi tayyor")
    
    # Buyruqlarni o'rnatish
    await set_commands()
    logger.info("✅ Buyruqlar o'rnatildi")
    
    # Botni ishga tushirish
    logger.info("🚀 Bot ishga tushdi!")
    await dp.start_polling(bot, skip_updates=True)


if __name__ == "__main__":
    asyncio.run(main())
