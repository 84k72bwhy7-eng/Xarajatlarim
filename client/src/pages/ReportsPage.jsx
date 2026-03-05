import React, { useState, useEffect } from 'react';
import { DownloadCloud, Loader2, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTransactions, downloadExcelReport } from '../lib/api';
import { formatCurrency } from '../lib/format';
import CashflowChart from '../components/CashflowChart';
import CategoryPieChart from '../components/CategoryPieChart';

export default function ReportsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [transactions, setTransactions] = useState([]);

    // Default to current month
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch ALL transactions for the selected month to build charts
            const padM = month.toString().padStart(2, '0');
            const startDate = `${year}-${padM}-01`;
            // Calculate last day of month
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${padM}-${lastDay}`;

            const res = await getTransactions({ startDate, endDate, limit: 10000 });
            setTransactions(res.data?.transactions || res.data || []);
        } catch (err) {
            console.error('Failed to fetch report data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadExcelReport(month, year);
        } catch (err) {
            alert('Hisobotni yuklab olishda xatolik yuz berdi');
        } finally {
            setDownloading(false);
        }
    };

    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;

    const months = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];

    const StatCard = ({ title, value, type, icon: Icon }) => (
        <div className="bg-white rounded-2xl p-4 flex-1 flex flex-col justify-between" style={{ boxShadow: '0 4px 16px rgba(26,77,58,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                        backgroundColor: type === 'income' ? '#e8f5ed' : type === 'expense' ? '#fcf2ee' : '#eaf2fd',
                        color: type === 'income' ? '#2d7a55' : type === 'expense' ? '#a06040' : '#2b6cb0'
                    }}>
                    <Icon size={16} />
                </div>
                <span className="text-xs font-semibold" style={{ color: '#7d4e31' }}>{title}</span>
            </div>
            <p className="text-lg font-bold truncate" style={{ color: type === 'income' ? '#1e6142' : type === 'expense' ? '#7d4e31' : '#1a202c' }}>
                {formatCurrency(value)}
            </p>
        </div>
    );

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-20">
            <h1 className="text-2xl font-bold" style={{ color: '#1a4d3a' }}>📊 Hisobotlar</h1>

            {/* Header / Selector */}
            <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between" style={{ boxShadow: '0 4px 16px rgba(26,77,58,0.06)' }}>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="flex-1 bg-gray-50 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none border hover:border-green-300 transition"
                        style={{ color: '#1a4d3a', borderColor: '#dff2ea' }}
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="bg-gray-50 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none border hover:border-green-300 transition"
                        style={{ color: '#1a4d3a', borderColor: '#dff2ea' }}
                    >
                        {[year - 1, year, year + 1].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition hover:opacity-90 active:scale-95 disabled:opacity-70"
                    style={{ background: 'linear-gradient(135deg, #2d7a55, #1e6142)' }}
                >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                    Excel formatida
                </button>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 size={32} className="animate-spin text-green-600" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <StatCard title="Daromad" value={income} type="income" icon={ArrowDownRight} />
                        <StatCard title="Xarajat" value={expense} type="expense" icon={ArrowUpRight} />
                        <div className="col-span-2 md:col-span-1">
                            <StatCard title="Sof Qoldiq" value={net} type="net" icon={Activity} />
                        </div>
                    </div>

                    {/* Charts */}
                    {transactions.length > 0 ? (
                        <div className="space-y-5">
                            <CashflowChart data={transactions} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <CategoryPieChart data={transactions} type="EXPENSE" />
                                <CategoryPieChart data={transactions} type="INCOME" />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 4px 16px rgba(26,77,58,0.06)' }}>
                            <Activity size={40} className="mx-auto mb-4 opacity-20" style={{ color: '#1a4d3a' }} />
                            <p className="font-semibold" style={{ color: '#7d4e31' }}>Ushbu oy uchun ma'lumot topilmadi.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
