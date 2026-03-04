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
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Kategoriyalarni olishda xato' });
    }
});

// POST /api/categories
router.post('/', async (req, res) => {
    try {
        const { name, icon, color, type } = req.body;
        if (!name || !type) return res.status(400).json({ error: 'name va type kerak' });

        const category = await prisma.category.create({
            data: {
                name,
                icon: icon || '📦',
                color: color || '#2d7a55',
                type: type || 'EXPENSE',
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

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, icon, color, type } = req.body;

        // Foydalanuvchi o'z kategoriyasini tahrirlashi kerak
        const existing = await prisma.category.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!existing) return res.status(404).json({ error: 'Kategoriya topilmadi' });

        const updated = await prisma.category.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(icon && { icon }),
                ...(color && { color }),
                ...(type && { type }),
            },
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Kategoriyani yangilashda xato" });
    }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
    try {
        const existing = await prisma.category.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!existing) return res.status(404).json({ error: 'Kategoriya topilmadi' });

        await prisma.category.delete({ where: { id: req.params.id } });
        res.json({ message: "Kategoriya o'chirildi" });
    } catch (error) {
        res.status(500).json({ error: "Kategoriyani o'chirishda xato" });
    }
});

export default router;
