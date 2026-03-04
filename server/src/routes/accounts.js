import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

// GET /api/accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'asc' },
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Hisoblarni olishda xato' });
    }
});

// POST /api/accounts
router.post('/', async (req, res) => {
    try {
        const { name, type, balance, color, icon } = req.body;
        const account = await prisma.account.create({
            data: {
                name,
                type: type || 'CASH',
                balance: parseFloat(balance) || 0,
                color: color || '#6366f1',
                icon: icon || 'wallet',
                userId: req.userId,
            },
        });
        res.status(201).json(account);
    } catch (error) {
        res.status(500).json({ error: 'Hisob yaratishda xato' });
    }
});

// PUT /api/accounts/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, type, color, icon } = req.body;
        const account = await prisma.account.update({
            where: { id: req.params.id },
            data: { name, type, color, icon },
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Hisobni yangilashda xato' });
    }
});

// DELETE /api/accounts/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma.account.delete({ where: { id: req.params.id } });
        res.json({ message: "Hisob o'chirildi" });
    } catch (error) {
        res.status(500).json({ error: "Hisobni o'chirishda xato" });
    }
});
export default router;
