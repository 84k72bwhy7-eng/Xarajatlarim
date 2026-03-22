import express from 'express';
import prisma from '../prisma.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// GET /api/budgets — Oylik byudjetlar
router.get('/', async (req, res) => {
    try {
        const { month, year } = req.query;
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        const budgets = await prisma.budget.findMany({
            where: { userId: req.userId, month: m, year: y },
            include: { category: true },
        });

        // Har bir byudjet uchun sarflangan miqdorni hisoblash
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        const enriched = await Promise.all(
            budgets.map(async (budget) => {
                const spent = await prisma.transaction.aggregate({
                    where: {
                        userId: req.userId,
                        categoryId: budget.categoryId,
                        type: 'EXPENSE',
                        date: { gte: startDate, lte: endDate },
                    },
                    _sum: { amount: true },
                });
                return {
                    ...budget,
                    spent: spent._sum.amount || 0,
                    remaining: budget.amount - (spent._sum.amount || 0),
                    percentage: ((spent._sum.amount || 0) / budget.amount) * 100,
                };
            })
        );

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: 'Byudjetlarni olishda xato' });
    }
});

// POST /api/budgets
router.post('/', async (req, res) => {
    try {
        const { categoryId, amount, alertThreshold, month, year } = req.body;
        const m = month || new Date().getMonth() + 1;
        const y = year || new Date().getFullYear();

        const budget = await prisma.budget.upsert({
            where: {
                userId_categoryId_month_year: {
                    userId: req.userId,
                    categoryId,
                    month: m,
                    year: y,
                },
            },
            update: { amount: parseFloat(amount), alertThreshold },
            create: {
                userId: req.userId,
                categoryId,
                amount: parseFloat(amount),
                alertThreshold: alertThreshold || 80,
                month: m,
                year: y,
            },
            include: { category: true },
        });

        res.status(201).json(budget);
    } catch (error) {
        console.error('Budget error:', error);
        res.status(500).json({ error: 'Byudjet yaratishda xato' });
    }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma.budget.delete({ where: { id: req.params.id } });
        res.json({ message: "Byudjet o'chirildi" });
    } catch (error) {
        res.status(500).json({ error: "Byudjetni o'chirishda xato" });
    }
});
export default router;
