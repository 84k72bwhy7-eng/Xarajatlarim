import express from 'express';
import prisma from '../prisma.js';
import auth from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
// SuperAdmin middleware
const superAdmin = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
        if (user?.role !== 'SUPERADMIN') {
            return res.status(403).json({ error: 'Ruxsat yo\'q. Faqat SuperAdmin uchun.' });
        }
        next();
    } catch {
        res.status(500).json({ error: 'Server xatosi' });
    }
};

router.use(auth);
router.use(superAdmin);

// GET /api/admin/users — Barcha foydalanuvchilar
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, email: true, name: true, avatar: true,
                role: true, currency: true, telegramId: true, createdAt: true,
                _count: { select: { transactions: true, categories: true, accounts: true } }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// PUT /api/admin/users/:id/role — Foydalanuvchi rolini o'zgartirish
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['USER', 'SUPERADMIN'].includes(role)) {
            return res.status(400).json({ error: "Role USER yoki SUPERADMIN bo'lishi kerak" });
        }
        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, email: true, name: true, role: true },
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// DELETE /api/admin/users/:id — Foydalanuvchini o'chirish
router.delete('/users/:id', async (req, res) => {
    try {
        if (req.params.id === req.userId) {
            return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" });
        }
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: "Foydalanuvchi o'chirildi" });
    } catch (error) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// GET /api/admin/stats — Umumiy statistika
router.get('/stats', async (req, res) => {
    try {
        const [userCount, txCount, totalVolume] = await Promise.all([
            prisma.user.count(),
            prisma.transaction.count(),
            prisma.transaction.aggregate({ _sum: { amount: true } }),
        ]);
        res.json({
            users: userCount,
            transactions: txCount,
            totalVolume: totalVolume._sum.amount || 0,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// POST /api/admin/create-superadmin — Birinchi superadmin yaratish (faqat SECRET_KEY bilan)
// Bu endpoint auth yo'q - alohida himoya qilish kerak
export const createSuperAdminRoute = express.Router();
createSuperAdminRoute.post('/create-superadmin', async (req, res) => {
    try {
        const { email, password, name, secret } = req.body;
        if (secret !== process.env.SUPERADMIN_SECRET) {
            return res.status(403).json({ error: 'Noto\'g\'ri secret kalit' });
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            // Agar mavjud bo'lsa, superadminga o'tkazish
            const updated = await prisma.user.update({
                where: { email },
                data: { role: 'SUPERADMIN' },
                select: { id: true, email: true, name: true, role: true }
            });
            return res.json({ message: 'Mavjud foydalanuvchi superadminga o\'tkazildi', user: updated });
        }

        const DEFAULT_CATEGORIES = [
            { name: 'Oziq-ovqat', icon: '🍔', type: 'EXPENSE', color: '#2d7a55' },
            { name: 'Transport', icon: '🚗', type: 'EXPENSE', color: '#a06040' },
            { name: 'Maosh', icon: '💵', type: 'INCOME', color: '#1a4d3a' },
        ];

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                email, password: hashed, name, role: 'SUPERADMIN',
                categories: { create: DEFAULT_CATEGORIES },
                accounts: { create: { name: 'Asosiy', type: 'CASH', balance: 0, color: '#1a4d3a', icon: 'wallet' } }
            },
            select: { id: true, email: true, name: true, role: true }
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Create superadmin error:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

export default router;
