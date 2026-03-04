import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Wallet, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight, CreditCard, Activity, Plus, Loader2, Leaf
} from 'lucide-react';
import CashflowChart from './CashflowChart';
import CategoryPieChart from './CategoryPieChart';
import SafeToSpend from './SafeToSpend';
import AddTransactionModal from './AddTransactionModal';
import { getDashboardSummary } from '../lib/api';

const StatCard = ({ title, amount, trend, icon: Icon, isPositive, variant = 'light' }) => {
    const variants = {
        forest: { bg: 'linear-gradient(135deg, #1a4d3a 0%, #2d7a55 100%)', text: '#ffffff', sub: 'rgba(255,255,255,0.7)', shadow: 'rgba(26,77,58,0.3)' },
        earth: { bg: 'linear-gradient(135deg, #7d4e31 0%, #a06040 100%)', text: '#ffffff', sub: 'rgba(255,255,255,0.7)', shadow: 'rgba(125,78,49,0.3)' },
        sand: { bg: 'linear-gradient(135deg, #f5e6d0 0%, #e8d5b7 100%)', text: '#3b1a0a', sub: '#7d4e31', shadow: 'rgba(125,78,49,0.15)' },
        light: { bg: '#ffffff', text: '#1a4d3a', sub: '#7d4e31', shadow: 'rgba(26,77,58,0.08)' },
    };
    const v = variants[variant];

    return (
        <div className="rounded-2xl p-5 flex items-center justify-between transition-all hover:scale-[1.02] duration-200"
            style={{ background: v.bg, boxShadow: `0 8px 24px ${v.shadow}`, color: v.text }}>
            <div>
                <p className="text-sm font-medium mb-1" style={{ color: v.sub }}>{title}</p>
                <h4 className="text-2xl font-bold" style={{ color: v.text }}>${Number(amount || 0).toLocaleString()}</h4>
                {trend !== undefined && (
                    <div className="flex items-center gap-1 mt-2 text-sm">
                        <span className="flex items-center font-medium" style={{ color: isPositive ? (variant === 'light' ? '#2d7a55' : 'rgba(255,255,255,0.9)') : '#ef4444' }}>
                            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(trend)}%
                        </span>
                    </div>
                )}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: variant === 'light' ? '#f0faf5' : 'rgba(255,255,255,0.18)', color: variant === 'light' ? '#1a4d3a' : 'white' }}>
                <Icon size={22} />
            </div>
        </div>
    );
};

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

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#1a4d3a' }}>
                        <Leaf size={28} className="text-white animate-pulse" />
                    </div>
                    <p className="font-medium" style={{ color: '#2d7a55' }}>{t('app.loading')}</p>
                </div>
            </div>
        );
    }

    const d = data || { netWorth: 0, monthly: { income: 0, expense: 0, balance: 0 }, categoryBreakdown: [], cashflow: [], recentTransactions: [], safeToSpend: null };
    const userName = tgUser?.first_name || JSON.parse(localStorage.getItem('user') || '{}')?.name || '';

    return (
        <>
            <AddTransactionModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={fetchData} />
            <div className="space-y-6 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#1a4d3a' }}>{t('nav.dashboard')}</h1>
                        {userName && (
                            <p className="text-sm mt-0.5" style={{ color: '#7d4e31' }}>
                                {t('dashboard.welcome', { name: userName })}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #1a4d3a 0%, #2d7a55 100%)', boxShadow: '0 4px 12px rgba(26,77,58,0.35)' }}
                    >
                        <Plus size={18} />
                        {t('transactions.addTransaction')}
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title={t('dashboard.netWorth')} amount={d.netWorth} trend={2.4} isPositive={true} icon={Wallet} variant="forest" />
                    <StatCard title={t('dashboard.monthlyIncome')} amount={d.monthly.income} trend={3.1} isPositive={true} icon={TrendingUp} variant="light" />
                    <StatCard title={t('dashboard.monthlyExpense')} amount={d.monthly.expense} trend={1.5} isPositive={false} icon={TrendingDown} variant="earth" />
                    <StatCard title={t('dashboard.safeToSpend')} amount={d.monthly.balance} trend={12.5} isPositive={d.monthly.balance >= 0} icon={CreditCard} variant="sand" />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <CashflowChart data={d.cashflow} />

                        {/* Recent Transactions */}
                        <div className="rounded-2xl p-6" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 16px rgba(26,77,58,0.08)' }}>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#1a4d3a' }}>
                                    <span className="w-2 h-6 rounded-full inline-block" style={{ backgroundColor: '#1a4d3a' }}></span>
                                    {t('dashboard.recentTransactions')}
                                </h3>
                                <a href="/transactions" className="text-sm font-medium hover:opacity-70 transition" style={{ color: '#2d7a55' }}>
                                    {t('dashboard.viewAll')}
                                </a>
                            </div>

                            {d.recentTransactions.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Activity size={36} className="mx-auto mb-3 opacity-20" style={{ color: '#1a4d3a' }} />
                                    <p className="text-sm" style={{ color: '#7d4e31' }}>{t('dashboard.noTransactions')}</p>
                                    <button onClick={() => setShowModal(true)} className="mt-3 text-sm font-medium hover:opacity-70" style={{ color: '#2d7a55' }}>
                                        + {t('transactions.addTransaction')}
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: '#f0faf5' }}>
                                    {d.recentTransactions.map((tx) => (
                                        <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-[#f0faf5] rounded-xl px-2 -mx-2 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                                                    style={{ backgroundColor: `${tx.category?.color || '#2d7a55'}18` }}>
                                                    {tx.category?.icon || (tx.type === 'INCOME' ? '💵' : '💸')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: '#1a4d3a' }}>{tx.description || tx.category?.name || '-'}</p>
                                                    <p className="text-xs" style={{ color: '#7d4e31' }}>{tx.category?.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-bold`} style={{ color: tx.type === 'INCOME' ? '#1e6142' : '#7d4e31' }}>
                                                    {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                                                </p>
                                                <p className="text-xs" style={{ color: '#a06040' }}>{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {d.safeToSpend && <SafeToSpend data={d.safeToSpend} />}
                        {d.categoryBreakdown.length > 0 && <CategoryPieChart data={d.categoryBreakdown} />}
                    </div>
                </div>
            </div>
        </>
    );
}
