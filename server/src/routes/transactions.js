import express from 'express';
import prisma from '../prisma.js';
import auth from '../middleware/auth.js';
import { autoCategorize } from '../services/categorizer.js';
import { convertToUZS, convertFromUZS } from '../services/currency.js';

const router = express.Router();
// All routes require auth
router.use(auth);

// POST /api/transactions — Tranzaksiya qo'shish
router.post('/', async (req, res) => {
    try {
        const { type, amount, description, note, tags, date, accountId, categoryId, transferToAccountId, originalCurrency } = req.body;
        // Front-end can send `amount` as the inputted value. 
        // We will treat the inputted `amount` as `originalAmount`.
        const inputAmount = parseFloat(amount);

        if (!type || !inputAmount || !accountId) {
            return res.status(400).json({ error: 'type, amount va accountId kerak' });
        }

        // Get user to know base currency
        const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { currency: true } });
        const baseCurrency = user.currency || 'UZS';
        const txCurrency = originalCurrency || baseCurrency;

        // Convert if currencies don't match
        let finalAmount = inputAmount;
        if (txCurrency !== baseCurrency) {
            const inUzs = await convertToUZS(inputAmount, txCurrency);
            finalAmount = await convertFromUZS(inUzs, baseCurrency);
        }

        // Auto-categorize if no category provided
        let finalCategoryId = categoryId;
        if (!finalCategoryId && description && type !== 'TRANSFER') {
            finalCategoryId = await autoCategorize(req.userId, description, type);
        }

        // Atomic transaction: create + update balances
        const result = await prisma.$transaction(async (tx) => {
            // Create transaction
            const transaction = await tx.transaction.create({
                data: {
                    type,
                    amount: finalAmount,
                    originalAmount: inputAmount,
                    originalCurrency: txCurrency,
                    description,
                    note,
                    tags: tags || [],
                    date: date ? new Date(date) : new Date(),
                    userId: req.userId,
                    accountId,
                    categoryId: finalCategoryId,
                    transferToAccountId: type === 'TRANSFER' ? transferToAccountId : null,
                },
                include: { category: true, account: true },
            });

            // Update source account balance
            const balanceChange = type === 'INCOME' ? finalAmount : -finalAmount;
            await tx.account.update({
                where: { id: accountId },
                data: { balance: { increment: balanceChange } },
            });

            // For transfers, update destination account
            if (type === 'TRANSFER' && transferToAccountId) {
                await tx.account.update({
                    where: { id: transferToAccountId },
                    data: { balance: { increment: finalAmount } },
                });
            }

            return transaction;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Tranzaksiya yaratishda xato' });
    }
});

// GET /api/transactions — Tranzaksiyalar ro'yxati
router.get('/', async (req, res) => {
    try {
        const { type, categoryId, accountId, startDate, endDate, page = 1, limit = 20 } = req.query;

        const where = { userId: req.userId };
        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;
        if (accountId) where.accountId = accountId;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: { category: true, account: true, transferToAccount: true },
                orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
            }),
            prisma.transaction.count({ where }),
        ]);

        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Tranzaksiyalarni olishda xato' });
    }
});

// GET /api/transactions/monthly-balance — Oylik balans
router.get('/monthly-balance', async (req, res) => {
    try {
        const { month, year } = req.query;
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: startDate, lte: endDate },
                type: { in: ['INCOME', 'EXPENSE'] },
            },
        });

        const income = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({
            month: m,
            year: y,
            income,
            expense,
            balance: income - expense,
            transactionCount: transactions.length,
        });
    } catch (error) {
        console.error('Monthly balance error:', error);
        res.status(500).json({ error: 'Oylik balansni hisoblashda xato' });
    }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
    try {
        const transaction = await prisma.transaction.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Tranzaksiya topilmadi' });
        }

        // Reverse balance changes
        await prisma.$transaction(async (tx) => {
            const reverseChange = transaction.type === 'INCOME'
                ? -transaction.amount
                : transaction.amount;

            await tx.account.update({
                where: { id: transaction.accountId },
                data: { balance: { increment: reverseChange } },
            });

            if (transaction.type === 'TRANSFER' && transaction.transferToAccountId) {
                await tx.account.update({
                    where: { id: transaction.transferToAccountId },
                    data: { balance: { increment: -transaction.amount } },
                });
            }

            await tx.transaction.delete({ where: { id: transaction.id } });
        });

        res.json({ message: "Tranzaksiya o'chirildi" });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: "Tranzaksiyani o'chirishda xato" });
    }
});

export default router;
