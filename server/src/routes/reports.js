import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Barcha API'lar uchun avtorizatsiya talab qilinadi
router.use(auth);

/**
 * 1. DAILY REPORT
 * Sum of income/expenses for the current day.
 */
router.get('/daily', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

        res.json({
            date: startOfDay.toISOString().split('T')[0],
            income,
            expense,
            netBalance: income - expense
        });
    } catch (error) {
        res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
});

/**
 * 2. WEEKLY REPORT WITH DAY-BY-DAY BREAKDOWN
 * Grouped data for the last 7 days.
 */
router.get('/weekly', async (req, res) => {
    try {
        const endDay = new Date();
        const startDay = new Date();
        startDay.setDate(endDay.getDate() - 6);
        startDay.setHours(0, 0, 0, 0);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: {
                    gte: startDay,
                    lte: endDay
                }
            }
        });

        // Initialize last 7 days array
        const dayByDay = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDay);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            dayByDay.push({
                date: dateStr,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                income: 0,
                expense: 0
            });
        }

        // Fill data
        transactions.forEach(tx => {
            const dateStr = new Date(tx.date).toISOString().split('T')[0];
            const dayObj = dayByDay.find(d => d.date === dateStr);
            if (dayObj) {
                if (tx.type === 'INCOME') dayObj.income += tx.amount;
                if (tx.type === 'EXPENSE') dayObj.expense += tx.amount;
            }
        });

        const totalIncome = dayByDay.reduce((acc, d) => acc + d.income, 0);
        const totalExpense = dayByDay.reduce((acc, d) => acc + d.expense, 0);

        res.json({
            period: `${startDay.toISOString().split('T')[0]} to ${endDay.toISOString().split('T')[0]}`,
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
            breakdown: dayByDay
        });
    } catch (error) {
        res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
});

/**
 * 3. MONTHLY REPORT
 * Total monthly inflow vs outflow and a percentage breakdown of categories.
 */
router.get('/monthly', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            include: { category: true }
        });

        const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

        // Category breakdown for expenses
        const categoryMap = {};
        transactions.filter(t => t.type === 'EXPENSE').forEach(tx => {
            const catName = tx.category?.name || 'Uncategorized';
            categoryMap[catName] = (categoryMap[catName] || 0) + tx.amount;
        });

        const categoryBreakdown = Object.keys(categoryMap).map(category => ({
            category,
            total: categoryMap[category],
            percentage: expense > 0 ? ((categoryMap[category] / expense) * 100).toFixed(2) + '%' : '0%'
        })).sort((a, b) => b.total - a.total);

        res.json({
            month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            totalIncome: income,
            totalExpense: expense,
            netBalance: income - expense,
            categoryBreakdown
        });
    } catch (error) {
        res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
});

export default router;
