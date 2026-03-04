# 💰 Xarajatlarim - Telegram Bot

Kundalik xarajatlarni kuzatib boruvchi Telegram bot.

## 🚀 Boshlash

```bash
# Virtual environment yaratish
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# yoki
venv\Scripts\activate  # Windows

# Kutubxonalarni o'rnatish
pip install -r requirements.txt

# .env faylini sozlash
cp .env.example .env
# .env faylini tahrirlang va BOT_TOKEN ni kiriting

# Botni ishga tushirish
python bot.py
```

## 📋 Bot buyruqlari

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Botni boshlash |
| `/add` | Xarajat qo'shish |
| `/today` | Bugungi xarajatlar |
| `/budget` | Byudjet belgilash |
| `/settings` | Sozlamalar |

## ✨ Imkoniyatlar

- ➕ Xarajat qo'shish (miqdor, kategoriya, izoh)
- 📊 Kunlik va oylik hisobotlar
- 📂 Kategoriyalar bo'yicha tahlil
- 💰 Oylik byudjet belgilash va kuzatish
- ⚙️ Shaxsiy kategoriyalar qo'shish
- 📅 Sana bo'yicha filtrlash

## 🏗️ Loyiha tuzilmasi

```
xarajatlarim/
├── bot.py           # Asosiy bot fayli
├── config.py        # Konfiguratsiya
├── database.py      # SQLite boshqaruv
├── requirements.txt # Kutubxonalar
├── .env             # Environment o'zgaruvchilar
└── handlers/
    ├── expense.py   # Xarajat va hisobot
    └── settings.py  # Byudjet va sozlamalar
```

## 🔧 Texnologiyalar

- **Python 3.9+**
- **aiogram 3.x** - Telegram Bot framework
- **SQLite** - Ma'lumotlar bazasi
- **python-dotenv** - .env boshqaruvi
