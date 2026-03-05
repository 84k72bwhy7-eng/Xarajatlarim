import asyncpg
import os
from dotenv import load_dotenv

async def get_db_pool():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Fallback to .env if not in environment
        from dotenv import load_dotenv
        load_dotenv(".env")
        db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set")
        
    return await asyncpg.create_pool(db_url)

async def get_user_by_tg_id(pool, telegram_id):
    if not pool:
        return None
    async with pool.acquire() as conn:
        # Prisma name is "telegramId", mapped to "users" table
        user = await conn.fetchrow("SELECT * FROM users WHERE \"telegramId\" = $1", str(telegram_id))
        return user

async def get_user_categories(pool, user_id):
    async with pool.acquire() as conn:
        return await conn.fetch("SELECT id, name, icon FROM categories WHERE \"userId\" = $1 AND type = 'EXPENSE' ORDER BY name", user_id)

async def get_user_accounts(pool, user_id):
    async with pool.acquire() as conn:
        return await conn.fetch("SELECT id, name, balance FROM accounts WHERE \"userId\" = $1 ORDER BY id LIMIT 1", user_id)

async def add_transaction_direct(pool, user_id, amount, category_id, account_id, description=None):
    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Create transaction record
            # We use cuid() style IDs on frontend/prisma, but here we can generate one or let DB handle if default is set.
            # prisma generate uses cuid strings. 
            import shortuuid
            tx_id = "cl" + shortuuid.uuid()[:23] # Mocking a cuid-like ID if needed, or check if DB allows null
            
            await conn.execute(
                "INSERT INTO transactions (id, type, amount, \"userId\", \"accountId\", \"categoryId\", description, date, \"createdAt\", \"updatedAt\") "
                "VALUES ($1, 'EXPENSE', $2, $3, $4, $5, $6, NOW(), NOW(), NOW())",
                tx_id, float(amount), user_id, account_id, category_id, description
            )
            
            # 2. Update account balance
            await conn.execute(
                "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
                float(amount), account_id
            )
            return tx_id

async def get_all_users_with_tg_id(pool):
    async with pool.acquire() as conn:
        return await conn.fetch("SELECT \"telegramId\", name FROM users WHERE \"telegramId\" IS NOT NULL")
