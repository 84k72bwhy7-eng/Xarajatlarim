const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Safe-to-Spend algoritmi:
 * 
 * safeToSpend = (currentBalance - upcomingBills - remainingBudget) / daysLeft
 * 
 * Hisoblash:
 * 1. Joriy balans (barcha hisoblar yig'indisi)
 * 2. Oyning qolgan kunlari uchun yaqinlashayotgan recurring xarajatlar
 * 3. Byudjet bo'yicha qolgan maqsad sarflar
 * 4. Kunlik xavfsiz sarflash miqdori
 */
async function calculateSafeToSpend(userId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysLeft = daysInMonth - now.getDate() + 1;

    // 1. Joriy balans
    const accounts = await prisma.account.findMany({ where: { userId } });
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 2. Yaqinlashayotgan recurring xarajatlar (bu oy qolganlari)
    const upcomingRecurring = await prisma.recurringTransaction.findMany({
        where: {
            userId,
            type: 'EXPENSE',
            active: true,
            nextDate: {
                gte: now,
                lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
            },
        },
    });
    const upcomingBills = upcomingRecurring.reduce((sum, r) => sum + r.amount, 0);

    // 3. Byudjet qoldiqlari
    const budgets = await prisma.budget.findMany({
        where: { userId, month: currentMonth, year: currentYear },
    });

    let budgetRemaining = 0;
    for (const budget of budgets) {
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        const spent = await prisma.transaction.aggregate({
            where: {
                userId,
                categoryId: budget.categoryId,
                type: 'EXPENSE',
                date: { gte: startOfMonth, lte: endOfMonth },
            },
            _sum: { amount: true },
        });

        const remaining = budget.amount - (spent._sum.amount || 0);
        if (remaining > 0) budgetRemaining += remaining;
    }

    // Hisoblash
    const availableBalance = totalBalance - upcomingBills;
    const safeTotal = Math.max(0, availableBalance);
    const safePerDay = daysLeft > 0 ? Math.round(safeTotal / daysLeft) : 0;

    return {
        totalBalance,
        upcomingBills,
        budgetRemaining,
        availableBalance,
        safeTotal,
        safePerDay,
        daysLeft,
    };
}

module.exports = { calculateSafeToSpend };
