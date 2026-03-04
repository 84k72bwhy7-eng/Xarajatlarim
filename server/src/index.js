import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import accountRoutes from './routes/accounts.js';
import budgetRoutes from './routes/budgets.js';
import dashboardRoutes from './routes/dashboard.js';
import categoryRoutes from './routes/categories.js';
import telegramAuthRoutes from './routes/telegramAuth.js';
import reportRoutes from './routes/reports.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Avatar uchun katta limit

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/twa', telegramAuthRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

app.post('/api/setup-superadmin-direct', async (req, res) => {
  try {
    const { email, password, name, secret } = req.body;
    if (secret !== process.env.SUPERADMIN_SECRET) {
      return res.status(403).json({ error: 'Noto\'g\'ri secret kalit' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'SUPERADMIN' },
        select: { id: true, email: true, name: true, role: true }
      });
      return res.json({ message: 'Mavjud foydalanuvchi superadminga o\'tkazildi', user: updated });
    }
    const hashed = await bcrypt.hash(password || 'admin123', 12);
    const user = await prisma.user.create({
      data: {
        email, password: hashed, name: name || 'Admin', role: 'SUPERADMIN',
        categories: {
          create: [
            { name: 'Oziq-ovqat', icon: '🍔', type: 'EXPENSE', color: '#2d7a55' },
            { name: 'Transport', icon: '🚗', type: 'EXPENSE', color: '#a06040' },
            { name: 'Maosh', icon: '💵', type: 'INCOME', color: '#1a4d3a' }
          ]
        },
        accounts: { create: { name: 'Asosiy', type: 'CASH', balance: 0, color: '#1a4d3a', icon: 'wallet' } }
      },
      select: { id: true, email: true, name: true, role: true }
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-deploy', (req, res) => {
  res.json({ message: 'Deploy is working!', time: new Date().toISOString() });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
export default app;
