import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Wallet, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight, CreditCard, Activity, Plus, Loader2
} from 'lucide-react';
import CashflowChart from './CashflowChart';
import CategoryPieChart from './CategoryPieChart';
import SafeToSpend from './SafeToSpend';
import AddTransactionModal from './AddTransactionModal';
import { getDashboardSummary } from '../lib/api';

const StatCard = ({ title, amount, trend, icon: Icon, isPositive, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow duration-300">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-slate-900">${Number(amount || 0).toLocaleString()}</h4>
            {trend && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                    <span className={`flex items-center font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(trend)}%
                    </span>
                </div>
            )}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass}`}>
            <Icon size={24} className="opacity-90" />
        </div>
    </div>
);

export default function Dashboard({ tgUser }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getDashboardSummary();
            setData(res.data);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                    <p className="text-slate-400 text-sm">{t('app.loading')}</p>
                </div>
            </div>
        );
    }

    // Fallback to zeros if no data
    const d = data || {
        netWorth: 0,
        monthly: { income: 0, expense: 0, balance: 0 },
        categoryBreakdown: [],
        cashflow: [],
        recentTransactions: [],
        safeToSpend: null,
    };

    const userName = tgUser?.first_name || JSON.parse(localStorage.getItem('user') || '{}')?.name || '';

    return (
        <>
            <AddTransactionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchData}
            />
            <div className="space-y-8 animate-in fade-in duration-500">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('nav.dashboard')}</h1>
                        <p className="text-slate-500 mt-1">
                            {userName ? t('dashboard.welcome', { name: userName }) : t('dashboard.welcome', { name: '' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            {t('transactions.addTransaction')}
                        </button>
                    </div>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title={t('dashboard.netWorth')}
                        amount={d.netWorth}
                        trend={2.4}
                        isPositive={true}
                        icon={Wallet}
                        colorClass="bg-indigo-50 text-indigo-600"
                    />
                    <StatCard
                        title={t('dashboard.monthlyIncome')}
                        amount={d.monthly.income}
                        trend={3.1}
                        isPositive={true}
                        icon={TrendingUp}
                        colorClass="bg-emerald-50 text-emerald-600"
                    />
                    <StatCard
                        title={t('dashboard.monthlyExpense')}
                        amount={d.monthly.expense}
                        trend={-1.5}
                        isPositive={d.monthly.expense < d.monthly.income}
                        icon={TrendingDown}
                        colorClass="bg-red-50 text-red-600"
                    />
                    <StatCard
                        title={t('dashboard.safeToSpend')}
                        amount={d.monthly.balance}
                        trend={12.5}
                        isPositive={d.monthly.balance >= 0}
                        icon={CreditCard}
                        colorClass="bg-amber-50 text-amber-600"
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CashflowChart data={d.cashflow} />

                        {/* Recent Transactions */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-slate-800 rounded-full inline-block"></span>
                                    {t('dashboard.recentTransactions')}
                                </h3>
                                <a href="/transactions" className="text-indigo-600 font-medium text-sm hover:underline">
                                    {t('dashboard.viewAll')}
                                </a>
                            </div>

                            {d.recentTransactions.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">
                                    <Activity size={40} className="mx-auto mb-3 opacity-30" />
                                    <p>{t('dashboard.noTransactions')}</p>
                                    <button onClick={() => setShowModal(true)} className="mt-4 text-indigo-600 font-medium hover:underline text-sm">
                                        + {t('transactions.addTransaction')}
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                                                <th className="pb-3 font-medium">{t('transactions.description')}</th>
                                                <th className="pb-3 font-medium">{t('transactions.category')}</th>
                                                <th className="pb-3 font-medium">{t('transactions.date')}</th>
                                                <th className="pb-3 font-medium text-right">{t('transactions.amount')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {d.recentTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4">
                                                        <div className="font-medium text-slate-900">{tx.description || tx.category?.name || '-'}</div>
                                                    </td>
                                                    <td className="py-4">
                                                        {tx.category && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base">{tx.category.icon}</span>
                                                                <span className="text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{tx.category.name}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-sm text-slate-500">
                                                        {new Date(tx.date).toLocaleDateString()}
                                                    </td>
                                                    <td className={`py-4 text-right font-semibold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {d.safeToSpend && <SafeToSpend data={d.safeToSpend} />}
                        {d.categoryBreakdown.length > 0 && <CategoryPieChart data={d.categoryBreakdown} />}
                    </div>
                </div>
            </div>
        </>
    );
}
