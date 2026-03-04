import sqlite3
from datetime import datetime
from config import DATABASE_PATH


def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Ma'lumotlar bazasini yaratish"""
    conn = get_connection()
    cursor = conn.cursor()

    # Foydalanuvchilar jadvali
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            telegram_id INTEGER UNIQUE NOT NULL,
            first_name TEXT,
            username TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Kategoriyalar jadvali
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Xarajatlar jadvali
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Byudjet jadvali
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT,
            amount REAL NOT NULL,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            UNIQUE(user_id, category, month, year),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()


def get_or_create_user(telegram_id, first_name=None, username=None):
    """Foydalanuvchini olish yoki yaratish"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,))
    user = cursor.fetchone()

    if not user:
        cursor.execute(
            "INSERT INTO users (telegram_id, first_name, username) VALUES (?, ?, ?)",
            (telegram_id, first_name, username)
        )
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,))
        user = cursor.fetchone()

        # Default kategoriyalarni qo'shish
        from config import DEFAULT_CATEGORIES
        for cat in DEFAULT_CATEGORIES:
            cursor.execute(
                "INSERT INTO categories (user_id, name) VALUES (?, ?)",
                (user['id'], cat)
            )
        conn.commit()

    conn.close()
    return dict(user)


def add_expense(user_id, amount, category, description, date=None):
    """Xarajat qo'shish"""
    if date is None:
        date = datetime.now().date()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)",
        (user_id, amount, category, description, date)
    )
    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return expense_id


def get_expenses(user_id, month=None, year=None, category=None, limit=None):
    """Xarajatlarni olish"""
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM expenses WHERE user_id = ?"
    params = [user_id]

    if month and year:
        query += " AND strftime('%m', date) = ? AND strftime('%Y', date) = ?"
        params.extend([f"{month:02d}", str(year)])
    if category:
        query += " AND category = ?"
        params.append(category)

    query += " ORDER BY date DESC, created_at DESC"

    if limit:
        query += f" LIMIT {limit}"

    cursor.execute(query, params)
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return expenses


def get_total_expenses(user_id, month=None, year=None):
    """Jami xarajatlarni hisoblash"""
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT SUM(amount) as total FROM expenses WHERE user_id = ?"
    params = [user_id]

    if month and year:
        query += " AND strftime('%m', date) = ? AND strftime('%Y', date) = ?"
        params.extend([f"{month:02d}", str(year)])

    cursor.execute(query, params)
    result = cursor.fetchone()
    conn.close()
    return result['total'] or 0


def get_expenses_by_category(user_id, month=None, year=None):
    """Kategoriya bo'yicha xarajatlarni hisoblash"""
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM expenses WHERE user_id = ?
    """
    params = [user_id]

    if month and year:
        query += " AND strftime('%m', date) = ? AND strftime('%Y', date) = ?"
        params.extend([f"{month:02d}", str(year)])

    query += " GROUP BY category ORDER BY total DESC"

    cursor.execute(query, params)
    result = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return result


def get_user_categories(user_id):
    """Foydalanuvchi kategoriyalarini olish"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM categories WHERE user_id = ? ORDER BY name", (user_id,))
    categories = [row['name'] for row in cursor.fetchall()]
    conn.close()
    return categories


def add_category(user_id, name):
    """Yangi kategoriya qo'shish"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO categories (user_id, name) VALUES (?, ?)", (user_id, name))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    conn.close()
    return success


def delete_expense(expense_id, user_id):
    """Xarajatni o'chirish"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def set_budget(user_id, amount, category=None, month=None, year=None):
    """Byudjet belgilash"""
    now = datetime.now()
    month = month or now.month
    year = year or now.year

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO budgets (user_id, category, amount, month, year)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, category, month, year) 
        DO UPDATE SET amount = excluded.amount
    """, (user_id, category, amount, month, year))
    conn.commit()
    conn.close()


def get_budget(user_id, month=None, year=None):
    """Byudjetni olish"""
    now = datetime.now()
    month = month or now.month
    year = year or now.year

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ?",
        (user_id, month, year)
    )
    budgets = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return budgets
