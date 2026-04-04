import asyncio
import logging
import jwt as pyjwt
from aiogram import Bot, Dispatcher
from aiogram.types import Message, BotCommand, WebAppInfo, MenuButtonWebApp, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import CommandStart, CommandObject
from aiogram.fsm.storage.memory import MemoryStorage
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from handlers.expense import router as expense_router, get_main_keyboard
import database as db
import os
from dotenv import load_dotenv

load_dotenv() # .env

BOT_TOKEN = os.getenv("BOT_TOKEN")
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-this")
VERSION = "v1.0.7"
APP_URL_SCHEME = "tanga"  # iOS ilovaning URL scheme'i

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

@dp.message(CommandStart(deep_link=True))
async def start_with_deep_link(message: Message, command: CommandObject):
    """Deep link bilan /start buyrug'i (iOS ilovadan)"""
    deep_link_param = command.args
    
    # iOS ilovadan kelgan auth so'rovi
    if deep_link_param and deep_link_param.startswith("auth_"):
        await handle_ios_auth(message, deep_link_param)
        return
    
    # Boshqa deep link yoki oddiy /start
    await start_handler(message)


async def handle_ios_auth(message: Message, start_param: str):
    """iOS ilova uchun Telegram avtorizatsiya"""
    tg_user = message.from_user
    pool = message.bot.pool
    
    try:
        # JWT token yaratish (Node.js backend bilan bir xil JWT_SECRET ishlatiladi)
        token_payload = {
            "telegram_id": str(tg_user.id),
            "first_name": tg_user.first_name or "",
            "last_name": tg_user.last_name or "",
            "username": tg_user.username or "",
            "auth_session": start_param,
        }
        token = pyjwt.encode(token_payload, JWT_SECRET, algorithm="HS256")
        
        # Ilovaga qaytish tugmasi
        deep_link_url = f"{APP_URL_SCHEME}://login?token={token}"
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📱 Tanga ilovasiga qaytish", url=deep_link_url)]
        ])
        
        user_name = tg_user.first_name or "Foydalanuvchi"
        await message.answer(
            f"✅ Xush kelibsiz, <b>{user_name}</b>!\n\n"
            f"Avtorizatsiya muvaffaqiyatli.\n"
            f"Ilovaga qaytish uchun quyidagi tugmani bosing:",
            parse_mode="HTML",
            reply_markup=keyboard
        )
        
        logger.info(f"[iOS Auth] User {tg_user.id} ({user_name}) authenticated via deep link")
        
    except Exception as e:
        logger.error(f"[iOS Auth] Error: {e}")
        await message.answer(
            "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
            parse_mode="HTML"
        )


@dp.message(CommandStart())
async def start_handler(message: Message):
    """Start buyrug'i"""
    pool = message.bot.pool
    user = await db.get_user_by_tg_id(pool, message.from_user.id)

    if not user:
        tg_id = message.from_user.id
        welcome_text = (
            f"👋 Salom, <b>{message.from_user.first_name}</b>!\n\n"
            "💰 <b>Xarajatlarim</b> botiga xush kelibsiz!\n\n"
            "Botdan to'g'ridan-to'g'ri foydalanish uchun hisobingizni bog'lash kerak.\n\n"
            "📝 <b>Nima qilish kerak?</b>\n"
            "1. Pastdagi tugma orqali <b>Mini App</b> ga kiring.\n"
            "2. Kirishingiz bilan hisobingiz avtomat bog'lanadi.\n"
            "3. Keyin botda xarajat kiritishni boshlashingiz mumkin.\n\n"
            f"🆔 Sizning ID: <code>{tg_id}</code>\n"
            f"⚙️ Versiya: {VERSION}"
        )
        await message.answer(
            welcome_text, 
            parse_mode="HTML", 
            reply_markup=await get_main_keyboard(pool)
        )
        logger.info(f"Unrecognized user: {tg_id}")
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
