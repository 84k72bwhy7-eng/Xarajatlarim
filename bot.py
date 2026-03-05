import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.types import Message, BotCommand, WebAppInfo, MenuButtonWebApp
from aiogram.filters import CommandStart
from aiogram.fsm.storage.memory import MemoryStorage
from config import BOT_TOKEN
import database as db
from handlers.expense import router as expense_router
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

def get_webapp_keyboard():
    from aiogram.utils.keyboard import ReplyKeyboardBuilder
    from aiogram.types import WebAppInfo
    builder = ReplyKeyboardBuilder()
    WEBAPP_URL = "https://frontend-production-a930.up.railway.app" 
    builder.button(text="🚀 Ilovani ochish", web_app=WebAppInfo(url=WEBAPP_URL))
    return builder.as_markup(resize_keyboard=True)

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
        "👇 Pastdagi <b>Ilovani ochish</b> tugmasi orqali to'liq panelga kiring!"
    )

    await message.answer(
        welcome_text,
        parse_mode="HTML",
        reply_markup=get_webapp_keyboard()
    )


@dp.message(CommandStart(deep_link=True))
async def start_with_ref(message: Message):
    await start_handler(message)


async def setup_bot_ui():
    """Bot UI sozlamalari: Buyruqlarni o'chirish va Menu knopkasini o'rnatish"""
    # 1. Buyruqlarni olib tashlash
    await bot.delete_my_commands()
    
    # 2. Ko'k Menu knopkasini Mini App ga sozlash
    WEBAPP_URL = "https://frontend-production-a930.up.railway.app"
    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="Ilovani ochish",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    )


async def main():
    """Asosiy funksiya"""
    logger.info("🤖 Bot ishga tushmoqda...")
    
    # Ma'lumotlar bazasini ishga tushirish
    db.init_db()
    logger.info("✅ Ma'lumotlar bazasi tayyor")
    
    # Bot UI ni sozlash (Buyruqlar va Menu knopkasi)
    await setup_bot_ui()
    logger.info("✅ Bot UI (Menu button) sozlandi")
    
    # Botni ishga tushirish
    logger.info("🚀 Bot ishga tushdi!")
    await dp.start_polling(bot, skip_updates=True)


if __name__ == "__main__":
    asyncio.run(main())
