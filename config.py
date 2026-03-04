import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "8738298217:AAEOMBSqXSIQ6NiX8cvMwPRBT46HtGGNgms")
DATABASE_PATH = os.getenv("DATABASE_PATH", "xarajatlarim.db")

# Default kategoriyalar
DEFAULT_CATEGORIES = [
    "🍔 Oziq-ovqat",
    "🚗 Transport",
    "🏠 Uy-joy",
    "💊 Sog'liqni saqlash",
    "👕 Kiyim-kechak",
    "📚 Ta'lim",
    "🎮 Ko'ngil ochar",
    "💡 Kommunal",
    "📱 Telefon/Internet",
    "🎁 Sovg'alar",
    "✈️ Sayohat",
    "💰 Boshqa",
]

# Valyuta
CURRENCY = "so'm"
