import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Wallet, HandCoins, Target, Trash2, Leaf,
    Activity, ArrowUpRight, ArrowDownLeft, ChevronRight
} from 'lucide-react';
import CashflowChart from './CashflowChart';
import CategoryPieChart from './CategoryPieChart';
import SafeToSpend from './SafeToSpend';
import AddTransactionModal from './AddTransactionModal';
import { getDashboardSummary, getDebts, getGoals, createCategory, updateCategory, deleteCategory } from '../lib/api';

export default function Dashboard({ tgUser }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTxModal, setShowTxModal] = useState(false);

    // Summary Data States
    const [debtData, setDebtData] = useState({ debts: [], stats: {} });
    const [goalData, setGoalData] = useState({ goals: [], stats: {} });

    // Category Modal States
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [catForm, setCatForm] = useState({ name: '', icon: '💰', color: '#1a4d3a', monthlyLimit: 0 });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [dashRes, debtsRes, goalsRes] = await Promise.allSettled([
                getDashboardSummary(),
                getDebts(),
                getGoals()
            ]);
            if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
            if (debtsRes.status === 'fulfilled') setDebtData(debtsRes.value.data);
            if (goalsRes.status === 'fulfilled') setGoalData(goalsRes.value.data);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Category CRUD
    const handleCatSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...catForm, type: 'EXPENSE' };
            if (editingCategory) {
                await updateCategory(editingCategory.id, payload);
            } else {
                await createCategory(payload);
            }
            setIsCatModalOpen(false);
            fetchData();
        } catch (err) {
            alert('Xatolik yuz berdi');
        }
    };

    const handleCatDelete = async (id) => {
        if (!confirm("O'chirmoqchimisiz?")) return;
        try {
            await deleteCategory(id);
            setIsCatModalOpen(false);
            fetchData();
        } catch (err) {
            alert('O\'chirishda xato yuz berdi');
        }
    };

    const openCatModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat);
            setCatForm({ name: cat.name, icon: cat.icon, color: cat.color, monthlyLimit: cat.monthlyLimit || 0 });
        } else {
            setEditingCategory(null);
            setCatForm({ name: '', icon: '💰', color: '#7d4e31', monthlyLimit: 0 });
        }
        setIsCatModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1a4d3a' }}>
                        <Leaf size={28} className="text-white animate-pulse" />
                    </div>
                    <p className="font-medium" style={{ color: '#2d7a55' }}>{t('app.loading')}</p>
                </div>
            </div>
        );
    }

    const d = data || { netWorth: 0, categoryBreakdown: [] };
    const userName = tgUser?.first_name || JSON.parse(localStorage.getItem('user') || '{}')?.name || '';

    // Goals Calculation
    const activeGoals = goalData.goals?.filter(g => !g.isCompleted) || [];
    const totalGoalTarget = activeGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalGoalCollected = activeGoals.reduce((sum, g) => sum + Number(g.savedAmount || 0), 0);

    return (
        <>
            <AddTransactionModal isOpen={showTxModal} onClose={() => setShowTxModal(false)} onSuccess={fetchData} />

            <div className="space-y-6 animate-in fade-in duration-500 pb-20">

                {/* Header Welcome */}
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1a4d3a' }}>{t('nav.dashboard')}</h1>
                    {userName && (
                        <p className="text-sm mt-0.5" style={{ color: '#7d4e31' }}>
                            {t('dashboard.welcome', { name: userName })}
                        </p>
                    )}
                </div>

                {/* 1) TOP 4 BLOCKS GRID */}
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                    {/* 1. Add Transaction */}
                    <button
                        onClick={() => setShowTxModal(true)}
                        className="rounded-xl sm:rounded-2xl p-2 sm:p-5 flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all hover:scale-[1.02] active:scale-95 text-white"
                        style={{ background: 'linear-gradient(135deg, #1a4d3a 0%, #2d7a55 100%)', boxShadow: '0 4px 12px rgba(26,77,58,0.2)' }}
                    >
                        <Plus size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5} />
                        <span className="font-bold text-[9px] sm:text-sm tracking-wide text-center leading-tight truncate w-full">{t('transactions.addTransaction')}</span>
                    </button>

                    {/* 2. Balance */}
                    <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition" style={{ boxShadow: '0 4px 12px rgba(26,77,58,0.06)' }}>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-forest-600 bg-forest-50 mb-1 sm:mb-2">
                            <Wallet size={14} className="sm:w-4 sm:h-4" />
                        </div>
                        <h3 className="text-sm sm:text-2xl font-black text-forest-900 truncate w-full">${d.netWorth.toLocaleString()}</h3>
                        <span className="text-[8px] sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider truncate w-full">{t('dashboard.balance')}</span>
                    </div>

                    {/* 3. Debts */}
                    <a href="/debts" className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition block" style={{ boxShadow: '0 4px 12px rgba(125,78,49,0.06)' }}>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-red-500 bg-red-50 mb-1 sm:mb-2">
                            <HandCoins size={14} className="sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex flex-col items-center w-full">
                            <p className="text-[10px] sm:text-sm text-red-500 font-bold truncate w-full">-${Number(debtData.stats?.totalGivenRemaining || 0).toLocaleString()}</p>
                            <span className="text-[8px] sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider truncate w-full mt-0.5">{t('debts.title')}</span>
                        </div>
                    </a>

                    {/* 4. Goals */}
                    <a href="/goals" className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition block" style={{ boxShadow: '0 4px 12px rgba(26,77,58,0.06)' }}>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-amber-500 bg-amber-50 mb-1 sm:mb-2">
                            <Target size={14} className="sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex flex-col items-center w-full">
                            <p className="text-[10px] sm:text-sm font-black text-forest-900 truncate w-full">
                                ${totalGoalCollected.toLocaleString()}
                            </p>
                            <span className="text-[8px] sm:text-[13px] font-bold text-slate-400 uppercase tracking-wider truncate w-full mt-0.5">{t('goals.title')}</span>
                        </div>
                    </a>
                </div>

                {/* 2) CATEGORIES GRID */}
                <div className="pt-2">
                    <h2 className="text-lg font-bold text-forest-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: '#7d4e31' }}></span>
                        {t('dashboard.categoriesAndLimits')}
                    </h2>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                        {d.categoryBreakdown.map(cat => {
                            if (cat.id === 'other') return null;

                            const limit = cat.monthlyLimit || 0;
                            const spent = cat.spentAmount || 0;
                            const isOver = limit > 0 && spent > limit;
                            const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => openCatModal(cat)}
                                    className="bg-white rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] relative overflow-hidden group"
                                    style={{ boxShadow: '0 4px 16px rgba(26,77,58,0.06)' }}
                                >
                                    {/* Icon */}
                                    <div className="flex items-center justify-between mb-3 w-full">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                                            {cat.icon}
                                        </div>
                                    </div>

                                    <h4 className="font-bold text-forest-900 leading-tight mb-2 truncate text-sm sm:text-base">{cat.name}</h4>

                                    {/* Amount Details */}
                                    <div className="flex flex-col sm:flex-row sm:items-end justify-between font-medium text-[10px] sm:text-xs mb-1 sm:mb-2">
                                        <span className={`font-bold text-xs sm:text-sm truncate w-full ${isOver ? 'text-red-500' : 'text-forest-700'}`}>
                                            ${spent.toLocaleString()}
                                        </span>
                                        <span className="text-slate-400 text-[9px] sm:text-xs">/ ${limit > 0 ? limit.toLocaleString() : '∞'}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    {limit > 0 && (
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-forest-500'}`}
                                                style={{ width: `${Math.max(progress, 3)}%` }}
                                            />
                                        </div>
                                    )}

                                    {/* Warning text */}
                                    {isOver && (
                                        <p className="text-[10px] text-red-500 mt-2 font-bold animate-pulse">
                                            {t('dashboard.overLimit')} (-${(spent - limit).toLocaleString()})
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        {/* + Add Category Card */}
                        <div
                            onClick={() => openCatModal()}
                            className="bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-earth-400 transition-all min-h-[160px] group"
                        >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white mb-3 shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#7d4e31' }}>
                                <Plus size={24} strokeWidth={3} />
                            </div>
                            <span className="text-sm font-bold text-slate-500 group-hover:text-earth-600 transition-colors">{t('dashboard.addCategory')}</span>
                        </div>
                    </div>
                </div>

                {/* 3) ANALYTICS & RECENT TRANSACTIONS */}
                <div className="pt-6 border-t border-forest-100/50 mt-8">
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

                                {d.recentTransactions?.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <Activity size={36} className="mx-auto mb-3 opacity-20" style={{ color: '#1a4d3a' }} />
                                        <p className="text-sm" style={{ color: '#7d4e31' }}>{t('dashboard.noTransactions')}</p>
                                        <button onClick={() => setShowTxModal(true)} className="mt-3 text-sm font-medium hover:opacity-70" style={{ color: '#2d7a55' }}>
                                            + {t('transactions.addTransaction')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="divide-y" style={{ borderColor: '#f0faf5' }}>
                                        {d.recentTransactions?.map((tx) => (
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
                            {d.categoryBreakdown?.length > 0 && (
                                <CategoryPieChart data={d.categoryBreakdown.map(c => ({ ...c, total: c.spentAmount }))} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Modal (Dashboard) */}
            {isCatModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-bold text-forest-900">
                                {editingCategory ? t('dashboard.edit') : t('dashboard.newCategory')}
                            </h3>
                            {editingCategory && (
                                <button type="button" onClick={() => handleCatDelete(editingCategory.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleCatSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1.5">{t('dashboard.categoryName')}</label>
                                <input
                                    type="text"
                                    required
                                    value={catForm.name}
                                    onChange={e => setCatForm(c => ({ ...c, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500 transition-shadow text-forest-900 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1.5">{t('dashboard.monthlyLimit')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={catForm.monthlyLimit}
                                    onChange={e => setCatForm(c => ({ ...c, monthlyLimit: e.target.value }))}
                                    className="w-full px-4 py-3 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500 transition-shadow text-forest-900 font-medium font-mono"
                                    placeholder="0 - limitsiz"
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-tight">{t('dashboard.limitHelpText')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-forest-800 mb-1.5">{t('dashboard.icon')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={catForm.icon}
                                        onChange={e => setCatForm(c => ({ ...c, icon: e.target.value }))}
                                        className="w-full px-4 py-3 bg-forest-50 border border-forest-100 rounded-xl text-center text-2xl outline-none focus:ring-2 focus:ring-forest-500 transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-forest-800 mb-1.5">{t('dashboard.color')}</label>
                                    <input
                                        type="color"
                                        value={catForm.color}
                                        onChange={e => setCatForm(c => ({ ...c, color: e.target.value }))}
                                        className="w-full h-[54px] p-1.5 bg-forest-50 border border-forest-100 rounded-xl outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCatModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 text-forest-800 bg-forest-50 hover:bg-forest-100"
                                >
                                    {t('transactions.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-6 text-white rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 shadow-lg"
                                    style={{ backgroundColor: '#7d4e31' }}
                                >
                                    {t('transactions.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
