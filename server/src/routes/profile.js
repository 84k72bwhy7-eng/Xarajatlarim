import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';
import { convertToUZS, convertFromUZS } from '../services/currency.js';

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

// GET /api/profile/exchange-rate — Joriy kursni olish (Frontend uchun)
router.get('/exchange-rate', async (req, res) => {
    try {
        const rate = await convertToUZS(1, 'USD');
        res.json({ currency: 'USD', rate });
    } catch (error) {
        res.status(500).json({ error: 'Kursni olishda xato' });
    }
});

// PUT /api/profile/change-currency — Asosiy valyutani va eski ma'lumotlarni o'zgartirish
router.put('/change-currency', async (req, res) => {
    try {
        const { targetCurrency } = req.body;
        if (!targetCurrency) return res.status(400).json({ error: 'Valyuta kodi kerak (UZS yoki USD)' });

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        const currentCurrency = user.currency || 'UZS';

        if (currentCurrency === targetCurrency) {
            return res.json({ message: 'Valyuta allaqachon bir xil', newCurrency: currentCurrency });
        }

        const inUzs = await convertToUZS(1, currentCurrency);
        const exchangeRate = await convertFromUZS(inUzs, targetCurrency);

        await prisma.$transaction(async (tx) => {
            // Update Accounts
            const accounts = await tx.account.findMany({ where: { userId: req.userId } });
            for (const acc of accounts) {
                await tx.account.update({
                    where: { id: acc.id },
                    data: { balance: acc.balance * exchangeRate }
                });
            }

            // Update Transactions
            const transactions = await tx.transaction.findMany({ where: { userId: req.userId } });
            for (const tr of transactions) {
                await tx.transaction.update({
                    where: { id: tr.id },
                    data: { amount: tr.amount * exchangeRate }
                });
            }

            // Update Categories (monthlyLimit)
            const categories = await tx.category.findMany({ where: { userId: req.userId } });
            for (const cat of categories) {
                if (cat.monthlyLimit) {
                    await tx.category.update({
                        where: { id: cat.id },
                        data: { monthlyLimit: cat.monthlyLimit * exchangeRate }
                    });
                }
            }

            // Update Budgets
            const budgets = await tx.budget.findMany({ where: { userId: req.userId } });
            for (const b of budgets) {
                await tx.budget.update({
                    where: { id: b.id },
                    data: {
                        amount: b.amount * exchangeRate,
                        spent: b.spent * exchangeRate
                    }
                });
            }

            // Update Debts
            const debts = await tx.debt.findMany({ where: { userId: req.userId } });
            for (const d of debts) {
                await tx.debt.update({
                    where: { id: d.id },
                    data: {
                        amount: d.amount * exchangeRate,
                        paidAmount: d.paidAmount * exchangeRate
                    }
                });
            }

            // Update Goals
            const goals = await tx.goal.findMany({ where: { userId: req.userId } });
            for (const g of goals) {
                await tx.goal.update({
                    where: { id: g.id },
                    data: {
                        targetAmount: g.targetAmount * exchangeRate,
                        savedAmount: g.savedAmount * exchangeRate
                    }
                });
            }

            // Update user currency
            await tx.user.update({
                where: { id: req.userId },
                data: { currency: targetCurrency }
            });
        });

        res.json({ message: 'Valyuta muvaffaqiyatli o\'zgartirildi', newCurrency: targetCurrency });
    } catch (error) {
        console.error('Change currency error:', error);
        res.status(500).json({ error: 'Valyutani almashtirishda xato yuz berdi' });
    }
});

export default router;
