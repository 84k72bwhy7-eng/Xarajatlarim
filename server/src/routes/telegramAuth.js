import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const BOT_TOKEN = process.env.BOT_TOKEN;

// Telegram Web App orqali login
router.post('/telegram', async (req, res) => {
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
            return res.status(401).json({ error: 'Telegram ma`lumotlari ishonchsiz' });
        }

        // 3. User ma'lumotlarini olish
        const userStr = urlParams.get('user');
        if (!userStr) {
            return res.status(400).json({ error: 'Foydalanuvchi ma`lumotlari topilmadi' });
        }

        const tgUser = JSON.parse(userStr);
        const emailHelper = `${tgUser.id}@t.me`;

        // 4. Foydalanuvchini bazadan qidirish yoki yaratish
        let user = await prisma.user.findUnique({ where: { email: emailHelper } });

        if (!user) {
            // Yangi user TWA orqali
            user = await prisma.user.create({
                data: {
                    email: emailHelper,
                    password: 'twa-oauth-' + tgUser.id, // Random parol
                    name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
                    // Default data gollash
                    categories: {
                        create: [
                            { name: 'Oziq-ovqat', icon: '🍔', type: 'EXPENSE', color: '#ef4444' },
                            { name: 'Transport', icon: '🚗', type: 'EXPENSE', color: '#f97316' },
                            { name: 'Maosh', icon: '💵', type: 'INCOME', color: '#22c55e' },
                        ]
                    },
                    accounts: {
                        create: { name: 'Asosiy', type: 'CASH', balance: 0, color: '#3b82f6', icon: 'wallet' }
                    }
                }
            });
        }

        // 5. JWT Token yaratish
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({ user, token });

    } catch (error) {
        console.error('Telegram auth error:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

export default router;
