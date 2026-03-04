import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;
        const where = { userId: req.userId };
        if (type) where.type = type;

        const categories = await prisma.category.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Kategoriyalarni olishda xato' });
    }
});

// POST /api/categories
router.post('/', async (req, res) => {
    try {
        const { name, icon, color, type, parentId } = req.body;
        const category = await prisma.category.create({
            data: {
                name,
                icon: icon || '📦',
                color: color || '#8b5cf6',
                type: type || 'EXPENSE',
                parentId,
                userId: req.userId,
            },
        });
        res.status(201).json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Bu kategoriya allaqachon mavjud' });
        }
        res.status(500).json({ error: 'Kategoriya yaratishda xato' });
    }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.json({ message: "Kategoriya o'chirildi" });
    } catch (error) {
        res.status(500).json({ error: "Kategoriyani o'chirishda xato" });
    }
});
export default router;
