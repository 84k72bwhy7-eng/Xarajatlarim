import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const router = express.Router();
const BOT_TOKEN = process.env.BOT_TOKEN;

// Telegram Web App orqali login
router.post('/', async (req, res) => {
    try {
        const { initData } = req.body;

        if (!initData) {
            return res.status(400).json({ error: 'initData kerak' });
        }

        // 1. Data parsing
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        // Sort keys alphabetically
        const keys = Array.from(urlParams.keys()).sort();
        const dataCheckString = keys.map(key => `${key}=${urlParams.get(key)}`).join('\n');

        // 2. Signature verification
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (calculatedHash !== hash) {
            return res.status(401).json({ error: "Telegram ma'lumotlari ishonchsiz" });
        }

        // 3. User ma'lumotlarini olish
        const userStr = urlParams.get('user');
        if (!userStr) {
            return res.status(400).json({ error: "Foydalanuvchi ma'lumotlari topilmadi" });
        }

        const tgUser = JSON.parse(userStr);
        const telegramId = String(tgUser.id);
        const emailHelper = `${telegramId}@t.me`;
        const fullName = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');

        // 4. BIRINCHI telegramId bo'yicha qidirish (turli qurilmalar bir hisob)
        let user = await prisma.user.findUnique({ where: { telegramId } });

        // Agar topilmasa, email bo'yicha qidirish (eski yozuvlar uchun)
        if (!user) {
            user = await prisma.user.findUnique({ where: { email: emailHelper } });

            // Eski emailli foydalanuvchiga telegramId qo'shish
            if (user && !user.telegramId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { telegramId },
                });
            }
        }

        if (!user) {
            // Yangi foydalanuvchi yaratish - to'liq kategoriyalar bilan
            user = await prisma.user.create({
                data: {
                    email: emailHelper,
                    password: 'twa-oauth-' + telegramId,
                    name: fullName,
                    telegramId,
                    categories: {
                        create: [
                            // Xarajat kategoriyalari
                            { name: 'Oziq-ovqat', icon: '🍔', type: 'EXPENSE', color: '#ef4444' },
                            { name: 'Transport', icon: '🚗', type: 'EXPENSE', color: '#f97316' },
                            { name: 'Kiyim', icon: '👕', type: 'EXPENSE', color: '#8b5cf6' },
                            { name: 'Kommunal', icon: '💡', type: 'EXPENSE', color: '#06b6d4' },
                            { name: "Sog'liq", icon: '💊', type: 'EXPENSE', color: '#ec4899' },
                            { name: "Ko'ngil ochar", icon: '🎮', type: 'EXPENSE', color: '#f59e0b' },
                            { name: "Ta'lim", icon: '📚', type: 'EXPENSE', color: '#6366f1' },
                            { name: 'Uy-joy', icon: '🏠', type: 'EXPENSE', color: '#10b981' },
                            { name: 'Boshqa', icon: '💰', type: 'EXPENSE', color: '#64748b' },
                            // Daromad kategoriyalari
                            { name: 'Maosh', icon: '💵', type: 'INCOME', color: '#22c55e' },
                            { name: 'Freelance', icon: '💻', type: 'INCOME', color: '#3b82f6' },
                            { name: 'Investitsiya', icon: '📈', type: 'INCOME', color: '#8b5cf6' },
                            { name: 'Boshqa daromad', icon: '🎁', type: 'INCOME', color: '#f59e0b' },
                        ]
                    },
                    accounts: {
                        create: {
                            name: 'Asosiy',
                            type: 'CASH',
                            balance: 0,
                            color: '#3b82f6',
                            icon: 'wallet'
                        }
                    }
                }
            });
        }

        // 5. JWT Token yaratish (30 kun)
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                telegramId: user.telegramId,
            },
            token
        });

    } catch (error) {
        console.error('Telegram auth error:', error);
        res.status(500).json({ error: 'Server xatosi: ' + error.message });
    }
});

export default router;
