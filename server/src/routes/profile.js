import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

// GET /api/profile — Profil ma'lumotlarini olish
router.get('/', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true, email: true, name: true, avatar: true,
                role: true, currency: true, telegramId: true, createdAt: true,
                _count: { select: { transactions: true, categories: true } }
            },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// PUT /api/profile — Profilni yangilash
router.put('/', async (req, res) => {
    try {
        const { name, email, avatar, currency } = req.body;

        // Email boshqa userda bormi?
        if (email) {
            const existing = await prisma.user.findFirst({
                where: { email, NOT: { id: req.userId } }
            });
            if (existing) {
                return res.status(400).json({ error: 'Bu email allaqachon ishlatilmoqda' });
            }
        }

        const updated = await prisma.user.update({
            where: { id: req.userId },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(avatar !== undefined && { avatar }),
                ...(currency && { currency }),
            },
            select: { id: true, email: true, name: true, avatar: true, role: true, currency: true },
        });
        res.json(updated);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Profilni yangilashda xato' });
    }
});

// PUT /api/profile/password — Parolni o'zgartirish
router.put('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Joriy va yangi parol kerak' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId } });

        // Telegram users may not have a real password, skip check
        const isTgUser = user.password.startsWith('twa-oauth-');
        if (!isTgUser) {
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) {
                return res.status(400).json({ error: "Joriy parol noto'g'ri" });
            }
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak" });
        }

        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
        res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
    } catch (error) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

export default router;
