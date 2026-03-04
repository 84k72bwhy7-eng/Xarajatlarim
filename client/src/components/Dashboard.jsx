import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Wallet, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight, CreditCard, Activity
} from 'lucide-react';
import CashflowChart from './CashflowChart';
import CategoryPieChart from './CategoryPieChart';
import SafeToSpend from './SafeToSpend';

// Helper component for stat cards
const StatCard = ({ title, amount, trend, icon: Icon, isPositive, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow duration-300">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-slate-900">${amount.toLocaleString()}</h4>
            {trend && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                    <span className={`flex items-center font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(trend)}%
                    </span>
                    <span className="text-slate-400">vs last month</span>
                </div>
            )}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass}`}>
            <Icon size={24} className="opacity-90" />
        </div>
    </div>
);

export default function Dashboard() {
    const { t } = useTranslation();
    // Mock data representing the API response from our Express server
    const [data, setData] = useState(null);

    useEffect(() => {
        // Simulate API fetch delay
        setTimeout(() => {
            setData({
                netWorth: 24500,
                monthly: {
                    income: 6800,
                    expense: 4120,
                    balance: 2680
                },
                categoryBreakdown: [
                    { name: "Housing", total: 1500, color: "#8b5cf6" },
                    { name: "Food", total: 800, color: "#10b981" },
                    { name: "Transport", total: 450, color: "#f59e0b" },
                    { name: "Entertainment", total: 320, color: "#ec4899" },
                    { name: "Shopping", total: 500, color: "#3b82f6" },
                    { name: "Others", total: 550, color: "#64748b" }
                ],
                cashflow: [
                    { month: 'Oct', income: 6200, expense: 4800 },
                    { month: 'Nov', income: 6400, expense: 5100 },
                    { month: 'Dec', income: 7200, expense: 6500 },
                    { month: 'Jan', income: 6500, expense: 4200 },
                    { month: 'Feb', income: 6600, expense: 4500 },
                    { month: 'Mar', income: 6800, expense: 4120 },
                ],
                recentTransactions: [
                    { id: 1, type: "EXPENSE", amount: 120, category: { name: "Food", icon: "🍔", color: "#10b981" }, description: "Whole Foods Market", date: new Date().toISOString() },
                    { id: 2, type: "EXPENSE", amount: 45, category: { name: "Transport", icon: "🚗", color: "#f59e0b" }, description: "Shell Gas Station", date: new Date(Date.now() - 86400000).toISOString() },
                    { id: 3, type: "INCOME", amount: 3400, category: { name: "Salary", icon: "💵", color: "#22c55e" }, description: "Bi-weekly Salary", date: new Date(Date.now() - 172800000).toISOString() },
                    { id: 4, type: "EXPENSE", amount: 85, category: { name: "Entertainment", icon: "🍿", color: "#ec4899" }, description: "Netflix & Spotify", date: new Date(Date.now() - 259200000).toISOString() },
                ],
                safeToSpend: {
                    safeTotal: 1780,
                    safePerDay: 84,
                    daysLeft: 21,
                    upcomingBills: 900,
                    availableBalance: 2680
                }
            });
        }, 600);
    }, []);

    if (!data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('nav.dashboard')}</h1>
                    <p className="text-slate-500 mt-1">{t('dashboard.welcome', { name: '' })}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-sm">
                        Export CSV
                    </button>
                    <button className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 flex items-center gap-2">
                        <Activity size={18} />
                        Add Transaction
                    </button>
                </div>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.netWorth')}
                    amount={data.netWorth}
                    trend={2.4}
                    isPositive={true}
                    icon={Wallet}
                    colorClass="bg-indigo-50 text-indigo-600"
                />
                <StatCard
                    title={t('dashboard.monthlyIncome')}
                    amount={data.monthly.income}
                    trend={3.1}
                    isPositive={true}
                    icon={TrendingUp}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title={t('dashboard.monthlyExpense')}
                    amount={data.monthly.expense}
                    trend={-1.5}
                    isPositive={true} // Decreasing expenses is positive
                    icon={TrendingDown}
                    colorClass="bg-red-50 text-red-600"
                />
                <StatCard
                    title="Balans / Savdo"
                    amount={data.monthly.balance}
                    trend={12.5}
                    isPositive={true}
                    icon={CreditCard}
                    colorClass="bg-amber-50 text-amber-600"
                />
            </div>

            {/* Main Grid area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Cashflow Chart */}
                <div className="lg:col-span-2 space-y-8">
                    <CashflowChart data={data.cashflow} />

                    {/* Recent Transactions Table */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-6 bg-slate-800 rounded-full inline-block"></span>
                                {t('dashboard.recentTransactions')}
                            </h3>
                            <button className="text-indigo-600 font-medium text-sm hover:underline">{t('dashboard.viewAll')}</button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-medium">Transaction</th>
                                        <th className="pb-3 font-medium">Category</th>
                                        <th className="pb-3 font-medium">Date</th>
                                        <th className="pb-3 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.recentTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4">
                                                <div className="font-medium text-slate-900">{tx.description}</div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">{tx.category.icon}</span>
                                                    <span className="text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{tx.category.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-slate-500">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </td>
                                            <td className={`py-4 text-right font-semibold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Safe to Spend + Pie Chart */}
                <div className="space-y-8">
                    <SafeToSpend data={data.safeToSpend} />
                    <CategoryPieChart data={data.categoryBreakdown} />
                </div>

            </div>
        </div>
    );
}
