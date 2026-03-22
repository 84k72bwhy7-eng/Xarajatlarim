import express from 'express';
import prisma from '../prisma.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// GET /api/goals — Barcha maqsadlarni olish
router.get('/', async (req, res) => {
    try {
        const goals = await prisma.goal.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
        });

        const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
        const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
        const completedCount = goals.filter(g => g.isCompleted).length;

        res.json({
            goals,
            stats: {
                total: goals.length,
                completedCount,
                activeCount: goals.length - completedCount,
                totalTarget,
                totalSaved,
                overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
            }
        });
    } catch (error) {
        console.error('Goals fetch error:', error);
        res.status(500).json({ error: 'Maqsadlarni olishda xato' });
    }
});

// POST /api/goals — Yangi maqsad yaratish
router.post('/', async (req, res) => {
    try {
        const { name, targetAmount, icon, color, deadline } = req.body;

        if (!name || !targetAmount) {
            return res.status(400).json({ error: 'Nom va maqsad summasi majburiy' });
        }

        const goal = await prisma.goal.create({
            data: {
                name,
                targetAmount: parseFloat(targetAmount),
                icon: icon || '🎯',
                color: color || '#2d7a55',
                deadline: deadline ? new Date(deadline) : null,
                userId: req.userId,
            },
        });

        res.status(201).json(goal);
    } catch (error) {
        console.error('Goal create error:', error);
        res.status(500).json({ error: 'Maqsad yaratishda xato' });
    }
});

// PUT /api/goals/:id — Maqsadni yangilash
router.put('/:id', async (req, res) => {
    try {
        const { name, targetAmount, savedAmount, icon, color, deadline, isCompleted } = req.body;

        const existing = await prisma.goal.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Maqsad topilmadi' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (targetAmount !== undefined) updateData.targetAmount = parseFloat(targetAmount);
        if (savedAmount !== undefined) updateData.savedAmount = parseFloat(savedAmount);
        if (icon !== undefined) updateData.icon = icon;
        if (color !== undefined) updateData.color = color;
        if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
        if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

        // Agar savedAmount >= targetAmount bo'lsa, avtomatik isCompleted=true
        const newSaved = updateData.savedAmount !== undefined ? updateData.savedAmount : existing.savedAmount;
        const newTarget = updateData.targetAmount !== undefined ? updateData.targetAmount : existing.targetAmount;
        if (newSaved >= newTarget) {
            updateData.isCompleted = true;
        }

        const goal = await prisma.goal.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.json(goal);
    } catch (error) {
        console.error('Goal update error:', error);
        res.status(500).json({ error: 'Maqsadni yangilashda xato' });
    }
});

// PUT /api/goals/:id/add — Maqsadga pul qo'shish
router.put('/:id/add', async (req, res) => {
    try {
        const { addAmount } = req.body;

        if (!addAmount || addAmount <= 0) {
            return res.status(400).json({ error: "Summa noto'g'ri" });
        }

        const goal = await prisma.goal.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!goal) {
            return res.status(404).json({ error: 'Maqsad topilmadi' });
        }

        const newSavedAmount = goal.savedAmount + parseFloat(addAmount);
        const isCompleted = newSavedAmount >= goal.targetAmount;

        const updatedGoal = await prisma.goal.update({
            where: { id: req.params.id },
            data: {
                savedAmount: newSavedAmount,
                isCompleted,
            },
        });

        res.json(updatedGoal);
    } catch (error) {
        console.error('Goal add error:', error);
        res.status(500).json({ error: "Pul qo'shishda xato" });
    }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
    try {
        const existing = await prisma.goal.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Maqsad topilmadi' });
        }

        await prisma.goal.delete({ where: { id: req.params.id } });
        res.json({ message: "Maqsad o'chirildi" });
    } catch (error) {
        console.error('Goal delete error:', error);
        res.status(500).json({ error: "Maqsadni o'chirishda xato" });
    }
});

export default router;
