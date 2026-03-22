import express from 'express';
import prisma from '../prisma.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// GET /api/debts — Barcha qarzlarni olish
router.get('/', async (req, res) => {
    try {
        const debts = await prisma.debt.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
        });

        // Umumiy statistika
        const given = debts.filter(d => d.type === 'GIVEN');
        const taken = debts.filter(d => d.type === 'TAKEN');

        const totalGiven = given.reduce((s, d) => s + d.amount, 0);
        const totalGivenPaid = given.reduce((s, d) => s + d.paidAmount, 0);
        const totalTaken = taken.reduce((s, d) => s + d.amount, 0);
        const totalTakenPaid = taken.reduce((s, d) => s + d.paidAmount, 0);

        res.json({
            debts,
            stats: {
                totalGiven,
                totalGivenPaid,
                totalGivenRemaining: totalGiven - totalGivenPaid,
                totalTaken,
                totalTakenPaid,
                totalTakenRemaining: totalTaken - totalTakenPaid,
            }
        });
    } catch (error) {
        console.error('Debts fetch error:', error);
        res.status(500).json({ error: 'Qarzlarni olishda xato' });
    }
});

// POST /api/debts — Yangi qarz yaratish
router.post('/', async (req, res) => {
    try {
        const { type, personName, amount, description, dueDate } = req.body;

        if (!type || !personName || !amount) {
            return res.status(400).json({ error: 'Tur, ism va summa majburiy' });
        }

        const debt = await prisma.debt.create({
            data: {
                type,
                personName,
                amount: parseFloat(amount),
                description: description || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                userId: req.userId,
            },
        });

        res.status(201).json(debt);
    } catch (error) {
        console.error('Debt create error:', error);
        res.status(500).json({ error: 'Qarz yaratishda xato' });
    }
});

// PUT /api/debts/:id — Qarzni yangilash
router.put('/:id', async (req, res) => {
    try {
        const { personName, amount, paidAmount, description, dueDate, isPaid } = req.body;

        // Qarz foydalanuvchiga tegishli ekanini tekshirish
        const existing = await prisma.debt.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Qarz topilmadi' });
        }

        const updateData = {};
        if (personName !== undefined) updateData.personName = personName;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (isPaid !== undefined) updateData.isPaid = isPaid;

        // Agar paidAmount >= amount bo'lsa, avtomatik isPaid=true
        const newPaid = updateData.paidAmount !== undefined ? updateData.paidAmount : existing.paidAmount;
        const newAmount = updateData.amount !== undefined ? updateData.amount : existing.amount;
        if (newPaid >= newAmount) {
            updateData.isPaid = true;
        }

        const debt = await prisma.debt.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.json(debt);
    } catch (error) {
        console.error('Debt update error:', error);
        res.status(500).json({ error: 'Qarzni yangilashda xato' });
    }
});

// PUT /api/debts/:id/pay — Qarzga to'lov kiritish (tranzaksiya bilan)
router.put('/:id/pay', async (req, res) => {
    try {
        const { payAmount } = req.body;

        if (!payAmount || payAmount <= 0) {
            return res.status(400).json({ error: "To'lov summasi noto'g'ri" });
        }

        const debt = await prisma.debt.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!debt) {
            return res.status(404).json({ error: 'Qarz topilmadi' });
        }

        const newPaidAmount = debt.paidAmount + parseFloat(payAmount);
        const isPaid = newPaidAmount >= debt.amount;

        const updatedDebt = await prisma.debt.update({
            where: { id: req.params.id },
            data: {
                paidAmount: newPaidAmount,
                isPaid,
            },
        });

        res.json(updatedDebt);
    } catch (error) {
        console.error('Debt pay error:', error);
        res.status(500).json({ error: "To'lov kiritishda xato" });
    }
});

// DELETE /api/debts/:id
router.delete('/:id', async (req, res) => {
    try {
        const existing = await prisma.debt.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Qarz topilmadi' });
        }

        await prisma.debt.delete({ where: { id: req.params.id } });
        res.json({ message: "Qarz o'chirildi" });
    } catch (error) {
        console.error('Debt delete error:', error);
        res.status(500).json({ error: "Qarzni o'chirishda xato" });
    }
});

export default router;
