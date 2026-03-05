import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.types import Message, BotCommand, WebAppInfo, MenuButtonWebApp
from aiogram.filters import CommandStart
from aiogram.fsm.storage.memory import MemoryStorage
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from handlers.expense import router as expense_router, get_main_keyboard
import database as db
import os
from dotenv import load_dotenv

load_dotenv() # .env

BOT_TOKEN = os.getenv("BOT_TOKEN")
VERSION = "v1.0.6"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# Routerlarni qo'shish
dp.include_router(expense_router)
# Settings router olib tashlandi (foydalanuvchi xohishi bilan)

# Eski get_webapp_keyboard olib tashlandi, handlers/expense.py dagi get_main_keyboard ishlatiladi

@dp.message(CommandStart())
async def start_handler(message: Message):
    """Start buyrug'i"""
    pool = message.bot.pool
    user = await db.get_user_by_tg_id(pool, message.from_user.id)

    if not user:
        welcome_text = (
            f"👋 Salom, <b>{message.from_user.first_name}</b>!\n\n"
            "💰 <b>Xarajatlarim</b> botiga xush kelibsiz!\n\n"
            f"Iltimos, avval Mini App orqali ro'yxatdan o'ting. ({VERSION})"
        )
        await message.answer(
            welcome_text, 
            parse_mode="HTML", 
            reply_markup=await get_main_keyboard(pool) # Bu yerda faqat "Ilovani ochish" chiqadi va eskilarini o'chiradi
        )
        return

    welcome_text = (
        f"👋 Salom, <b>{user['name']}</b>!\n\n"
        f"🔥 <b>Bot yangilandi!</b> ({VERSION})\n\n"
        "Xarajatlarni kiritish uchun pastdagi kategoriyalardan birini tanlang yoki Mini App ga kiring!"
    )

    await message.answer(
        welcome_text,
        parse_mode="HTML",
        reply_markup=await get_main_keyboard(pool, user['id'])
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


async def send_daily_reminders(bot_instance):
    """Barcha foydalanuvchilarga xarajatlarini kiritishni eslatish"""
    logger.info("📢 Eslatmalar yuborilmoqda...")
    users = await db.get_all_users_with_tg_id(bot_instance.pool)
    count = 0
    for u in users:
        try:
            await bot_instance.send_message(
                u['telegramId'],
                "🔔 <b>Xarajatlaringizni kiritishni unutmang!</b> 🌙\n\n"
                "Kuningiz qanday o'tdi? Bugungi xarajatlarni qayd etishni unutmang.",
                parse_mode="HTML"
            )
            count += 1
        except Exception as e:
            logger.error(f"Eslatma yuborishda xato ({u['telegramId']}): {e}")
    logger.info(f"✅ {count} ta foydalanuvchiga eslatma yuborildi.")

async def main():
    """Asosiy funksiya"""
    logger.info("🤖 Bot ishga tushmoqda...")
    
    # DB Pool yaratish
    try:
        bot.pool = await db.get_db_pool()
        logger.info("✅ PostgreSQL bog'lanishi o'rnatildi")
    except Exception as e:
        logger.error(f"❌ DB ga ulanishda xato: {e}")
        bot.pool = None
    
    # Bot UI ni sozlash
    await setup_bot_ui()
    
    # Eslatmalarni rejalashtirish (Har kuni 22:00)
    scheduler = AsyncIOScheduler(timezone="Asia/Tashkent")
    scheduler.add_job(send_daily_reminders, 'cron', hour=22, minute=0, args=[bot])
    scheduler.start()
    logger.info("✅ 22:00 dagi eslatma rejalashtirildi")
    
    # Botni ishga tushirish
    logger.info("🚀 Bot ishga tushdi!")
    await dp.start_polling(bot, skip_updates=True)


if __name__ == "__main__":
    asyncio.run(main())
