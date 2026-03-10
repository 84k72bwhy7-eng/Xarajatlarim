import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';
import { calculateSafeToSpend } from '../services/calculator.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

// GET /api/dashboard/summary — Asosiy dashboard ma'lumotlari
router.get('/summary', async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // 1. Net Worth — barcha hisoblar balansi
        const accounts = await prisma.account.findMany({
            where: { userId: req.userId },
        });
        const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        // 2. Bu oylik tranzaksiyalar
        const monthlyTransactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: startOfMonth, lte: endOfMonth },
                type: { in: ['INCOME', 'EXPENSE'] },
            },
            include: { category: true },
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpense = monthlyTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        // 3. Kategoriyalar va har birining sarfi (barcha EXPENSE kategoriyalari uchun)
        const categoriesData = await prisma.category.findMany({
            where: { userId: req.userId, type: 'EXPENSE' },
            orderBy: { name: 'asc' }
        });

        const categoriesSpent = categoriesData.map(cat => {
            const spent = monthlyTransactions
                .filter(t => t.categoryId === cat.id && t.type === 'EXPENSE')
                .reduce((sum, t) => sum + t.amount, 0);
            return {
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                monthlyLimit: cat.monthlyLimit || 0,
                spentAmount: spent
            };
        });

        // Boshqa (kategoriyasi o'chirilgan) xarajatlar uchun
        const otherSpent = monthlyTransactions
            .filter(t => !t.categoryId && t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        if (otherSpent > 0) {
            categoriesSpent.push({
                id: 'other',
                name: 'Boshqa',
                icon: '💸',
                color: '#64748b',
                monthlyLimit: 0,
                spentAmount: otherSpent
            });
        }

        const categories = categoriesSpent.sort((a, b) => b.spentAmount - a.spentAmount);

        // 4. Last 6 months cashflow
        const cashflow = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - 1 - i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0, 23, 59, 59);

            const txns = await prisma.transaction.findMany({
                where: {
                    userId: req.userId,
                    date: { gte: start, lte: end },
                    type: { in: ['INCOME', 'EXPENSE'] },
                },
            });

            const income = txns.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
            const expense = txns.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

            const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
            cashflow.push({
                month: monthNames[m - 1],
                year: y,
                income,
                expense,
                net: income - expense,
            });
        }

        // 5. So'nggi tranzaksiyalar
        const recentTransactions = await prisma.transaction.findMany({
            where: { userId: req.userId },
            include: { category: true, account: true, transferToAccount: true },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: 10,
        });

        // 6. Safe to spend
        const safeToSpend = await calculateSafeToSpend(req.userId);

        res.json({
            netWorth,
            accounts,
            monthly: {
                income: monthlyIncome,
                expense: monthlyExpense,
                balance: monthlyIncome - monthlyExpense,
            },
            categoryBreakdown: categories,
            cashflow,
            recentTransactions,
            safeToSpend,
        });
    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ error: 'Dashboard ma\'lumotlarni olishda xato' });
    }
});
export default router;
