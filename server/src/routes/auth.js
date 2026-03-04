const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Default kategoriyalar
const DEFAULT_CATEGORIES = [
    { name: 'Oziq-ovqat', icon: '🍔', type: 'EXPENSE', color: '#ef4444' },
    { name: 'Transport', icon: '🚗', type: 'EXPENSE', color: '#f97316' },
    { name: 'Uy-joy', icon: '🏠', type: 'EXPENSE', color: '#eab308' },
    { name: "Sog'liq", icon: '💊', type: 'EXPENSE', color: '#22c55e' },
    { name: 'Kiyim', icon: '👕', type: 'EXPENSE', color: '#3b82f6' },
    { name: "Ta'lim", icon: '📚', type: 'EXPENSE', color: '#8b5cf6' },
    { name: "Ko'ngil ochar", icon: '🎮', type: 'EXPENSE', color: '#ec4899' },
    { name: 'Kommunal', icon: '💡', type: 'EXPENSE', color: '#14b8a6' },
    { name: 'Internet', icon: '📱', type: 'EXPENSE', color: '#6366f1' },
    { name: 'Boshqa', icon: '💰', type: 'EXPENSE', color: '#64748b' },
    { name: 'Maosh', icon: '💵', type: 'INCOME', color: '#22c55e' },
    { name: 'Freelance', icon: '💻', type: 'INCOME', color: '#3b82f6' },
    { name: 'Investitsiya', icon: '📈', type: 'INCOME', color: '#8b5cf6' },
    { name: 'Boshqa daromad', icon: '🎁', type: 'INCOME', color: '#f97316' },
];

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password va ism kerak' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                // Default kategoriyalar yaratish
                categories: {
                    create: DEFAULT_CATEGORIES,
                },
                // Default naqd hisob yaratish
                accounts: {
                    create: {
                        name: 'Naqd pul',
                        type: 'CASH',
                        balance: 0,
                        color: '#22c55e',
                        icon: 'wallet',
                    },
                },
            },
            select: { id: true, email: true, name: true, currency: true },
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email va parol kerak' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.json({
            user: { id: user.id, email: user.email, name: user.name, currency: user.currency },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, name: true, currency: true, createdAt: true },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

module.exports = router;
