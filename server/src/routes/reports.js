import express from 'express';
import prisma from '../prisma.js';
import auth from '../middleware/auth.js';
import ExcelJS from 'exceljs';

const router = express.Router();
router.use(auth);

// GET /api/reports/excel
router.get('/excel', async (req, res) => {
    try {
        const { month, year } = req.query;
        // Default to current month/year if not provided
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        // Fetch user to know their currency preference, although the amounts in the DB are already converted to base.
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { currency: true, name: true }
        });
        const currency = user?.currency || 'UZS';

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.userId,
                date: { gte: startDate, lte: endDate },
                type: { in: ['INCOME', 'EXPENSE'] }
            },
            include: { category: true, account: true },
            orderBy: { date: 'asc' }
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Xarajatlarim App';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(`${y}-${m.toString().padStart(2, '0')} Hisoboti`);

        // Define columns
        worksheet.columns = [
            { header: 'Sana', key: 'date', width: 15 },
            { header: 'Kategoriya', key: 'category', width: 25 },
            { header: 'Hisob', key: 'account', width: 20 },
            { header: 'Izoh', key: 'description', width: 30 },
            { header: 'Turi', key: 'type', width: 15 },
            { header: `Summa (${currency})`, key: 'amount', width: 20 },
            { header: `Kiritilgan pul`, key: 'original_amount', width: 20 }
        ];

        // Style headers
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A4D3A' } // Dark green
        };

        // Add rows
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(tx => {
            const isIncome = tx.type === 'INCOME';
            if (isIncome) totalIncome += tx.amount;
            else totalExpense += tx.amount;

            let origStr = tx.originalAmount ? `${tx.originalAmount} ${tx.originalCurrency || currency}` : '';

            const row = worksheet.addRow({
                date: new Date(tx.date).toLocaleDateString(),
                category: tx.category?.name || '-',
                account: tx.account?.name || '-',
                description: tx.description || '-',
                type: isIncome ? 'Daromad' : 'Xarajat',
                amount: isIncome ? tx.amount : -tx.amount,
                original_amount: origStr
            });

            // Color code amount cell based on type
            row.getCell('amount').font = {
                color: { argb: isIncome ? 'FF1E6142' : 'FF7D4E31' }
            };
            row.getCell('amount').numFmt = '#,##0.00';

            // Highlight row background slightly if income
            if (isIncome) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF0FAF5' }
                };
            }
        });

        worksheet.addRow([]);

        // Add totals
        const totalRow = worksheet.addRow({
            date: 'JAMI',
            category: '',
            account: '',
            description: '',
            type: '',
            amount: totalIncome - totalExpense
        });

        totalRow.font = { bold: true };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDFF2EA' }
        };
        totalRow.getCell('amount').numFmt = '#,##0.00';

        // Add summary at the bottom
        worksheet.addRow([]);
        worksheet.addRow(['Daromad:', totalIncome]).font = { color: { argb: 'FF1E6142' } };
        worksheet.addRow(['Xarajat:', totalExpense]).font = { color: { argb: 'FF7D4E31' } };

        // Set response headers for download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Hisobot_${y}_${m}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Excel hisobotini yaratishda xatolik yuz berdi' });
    }
});

export default router;
