import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Wallet, HandCoins, Target, Trash2, Leaf,
    Activity, ArrowUpRight, ArrowDownLeft, ChevronRight, ChevronDown, Globe
} from 'lucide-react';
import CashflowChart from './CashflowChart';
import CategoryPieChart from './CategoryPieChart';
import SafeToSpend from './SafeToSpend';
import AddTransactionModal from './AddTransactionModal';
import { getDashboardSummary, getDebts, getGoals, createCategory, updateCategory, deleteCategory } from '../lib/api';
import { formatCurrency } from '../lib/format';

export default function Dashboard({ tgUser }) {
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTxModal, setShowTxModal] = useState(false);
    const [txInitialData, setTxInitialData] = useState({});

    // Touch Drag State
    const [touchDrag, setTouchDrag] = useState({ active: false, type: null, x: 0, y: 0, label: '', icon: null });

    // Summary Data States
    const [debtData, setDebtData] = useState({ debts: [], stats: {} });
    const [goalData, setGoalData] = useState({ goals: [], stats: {} });

    // Category Modal States
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [catForm, setCatForm] = useState({ name: '', icon: '💰', color: '#1a4d3a', monthlyLimit: 0 });

    const [accounts, setAccounts] = useState([]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [dashRes, debtsRes, goalsRes, accountsRes] = await Promise.allSettled([
                getDashboardSummary(),
                getDebts(),
                getGoals(),
                getAccounts()
            ]);
            if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
            if (debtsRes.status === 'fulfilled') setDebtData(debtsRes.value.data);
            if (goalsRes.status === 'fulfilled') setGoalData(goalsRes.value.data);
            if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value.data);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Touch Handlers
    const handleTouchStart = (e, type, label, icon) => {
        const touch = e.touches[0];
        setTouchDrag({
            active: true,
            type,
            x: touch.clientX,
            y: touch.clientY,
            label,
            icon
        });
    };

    const handleTouchMove = (e) => {
        if (!touchDrag.active) return;
        const touch = e.touches[0];
        setTouchDrag(prev => ({ ...prev, x: touch.clientX, y: touch.clientY }));

        // Prevent scroll when dragging
        if (e.cancelable) e.preventDefault();
    };

    const handleTouchEnd = (e) => {
        if (!touchDrag.active) return;

        const x = touchDrag.x;
        const y = touchDrag.y;
        setTouchDrag({ active: false, type: null, x: 0, y: 0, label: '', icon: null });

        // Find drop target
        const element = document.elementFromPoint(x, y);
        if (!element) return;

        const dropTarget = element.closest('[data-drop-target]');
        if (!dropTarget) return;

        const targetType = dropTarget.getAttribute('data-drop-type');
        const targetId = dropTarget.getAttribute('data-drop-id');

        if (touchDrag.type === 'add' && targetType === 'wallet') {
            setTxInitialData({ type: 'INCOME' });
            setShowTxModal(true);
        } else if (touchDrag.type === 'wallet' && targetType === 'category') {
            setTxInitialData({ type: 'EXPENSE', categoryId: targetId });
            setShowTxModal(true);
        }
    };

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
            <AddTransactionModal isOpen={showTxModal} onClose={() => { setShowTxModal(false); setTxInitialData({}); }} onSuccess={fetchData} initialData={txInitialData} />

            <div className="space-y-6 animate-in fade-in duration-500 pb-20">

                {/* Header: Avatar + Welcome + Language Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-forest-200 flex items-center justify-center font-bold text-base bg-forest-100 text-forest-700 shadow-sm cursor-pointer"
                            onClick={() => window.location.href = '/profile'}>
                            {(() => {
                                const user = JSON.parse(localStorage.getItem('user') || '{}');
                                const photoUrl = user?.avatar || tgUser?.photo_url;
                                if (photoUrl) {
                                    return <img src={photoUrl} alt="User" className="w-full h-full object-cover" />;
                                }
                                return <span>{userName?.charAt(0) || 'U'}</span>;
                            })()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: '#1a4d3a' }}>
                                {t('dashboard.welcome', { name: '' }).replace(',', '').trim()},
                            </h1>
                            <p className="text-lg font-bold" style={{ color: '#1a4d3a' }}>
                                {userName}!
                            </p>
                        </div>
                    </div>
                    {/* Language toggle */}
                    <button
                        onClick={() => {
                            const newLang = i18n.language === 'uz' ? 'ru' : 'uz';
                            i18n.changeLanguage(newLang);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all"
                        style={{ color: '#1a4d3a', borderColor: '#d0ddd4', backgroundColor: '#ffffff' }}
                    >
                        {i18n.language.toUpperCase()}
                        <ChevronDown size={14} />
                    </button>
                </div>

                {/* Top Row: Accounts (Horizontal Scroll) */}
                <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                    {/* 1. Hisobim (General Balance) */}
                    <div
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('type', 'wallet')}
                        onTouchStart={(e) => handleTouchStart(e, 'wallet', t('dashboard.balance'), <Wallet size={20} />)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            if (e.dataTransfer.getData('type') === 'add') {
                                e.preventDefault();
                                setTxInitialData({ type: 'INCOME' });
                                setShowTxModal(true);
                            }
                        }}
                        data-drop-target
                        data-drop-type="wallet"
                        className="bg-white rounded-2xl p-4 flex flex-col gap-2 transition-all cursor-grab active:cursor-grabbing touch-none min-w-[140px] snap-start"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                    >
                        <span className="text-xs font-semibold text-slate-500">{t('dashboard.balance')}</span>
                        <p className="text-base font-black truncate" style={{ color: '#1a4d3a' }}>{formatCurrency(d.netWorth)}</p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-1" style={{ backgroundColor: '#e8f5e9' }}>
                            <Wallet size={18} style={{ color: '#2d7a55' }} />
                        </div>
                    </div>

                    {/* Individual Accounts */}
                    {accounts.map(acc => (
                        <div
                            key={acc.id}
                            className="bg-white rounded-2xl p-4 flex flex-col gap-2 transition-all min-w-[140px] snap-start"
                            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                        >
                            <span className="text-xs font-semibold text-slate-500 truncate">{acc.name}</span>
                            <p className="text-base font-black truncate" style={{ color: '#1a4d3a' }}>{formatCurrency(acc.balance)}</p>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-1" style={{ backgroundColor: `${acc.color}15` }}>
                                <span className="text-lg">{acc.icon || '💳'}</span>
                            </div>
                        </div>
                    ))}

                    {/* Add Account Button */}
                    <a href="/profile" className="bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all min-w-[120px] snap-start group">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 transition-transform group-hover:scale-110" style={{ backgroundColor: '#2d7a55' }}>
                            <Plus size={18} strokeWidth={3} />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{t('profile.accounts')}</span>
                    </a>
                </div>

                {/* 2) CATEGORIES GRID */}
                <div className="pt-4 relative">
                    {/* FAB Add Transaction Button */}
                    <button
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('type', 'add')}
                        onTouchStart={(e) => handleTouchStart(e, 'add', t('transactions.addTransaction'), <Plus size={20} />)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => { setTxInitialData({}); setShowTxModal(true); }}
                        className="absolute -top-3 right-0 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl z-10 transition-all hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing touch-none"
                        style={{ background: 'linear-gradient(135deg, #1a4d3a 0%, #2d7a55 100%)', boxShadow: '0 6px 20px rgba(26,77,58,0.35)' }}
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </button>

                    <h2 className="text-lg font-bold text-forest-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: '#7d4e31' }}></span>
                        {t('dashboard.categoriesAndLimits')}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {d.categoryBreakdown.map(cat => {
                            if (cat.id === 'other') return null;

                            const limit = cat.monthlyLimit || 0;
                            const spent = cat.spentAmount || 0;
                            const isOver = limit > 0 && spent > limit;

                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => openCatModal(cat)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        if (e.dataTransfer.getData('type') === 'wallet') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setTxInitialData({ type: 'EXPENSE', categoryId: cat.id });
                                            setShowTxModal(true);
                                        }
                                    }}
                                    data-drop-target
                                    data-drop-type="category"
                                    data-drop-id={cat.id}
                                    className="bg-white rounded-2xl px-4 py-4 cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] flex items-center gap-3"
                                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                                >
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                        style={{ backgroundColor: `${cat.color}15` }}>
                                        {cat.icon}
                                    </div>
                                    {/* Name + Amount */}
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="font-bold text-forest-900 text-sm truncate">{t(`categories.${cat.name}`, cat.name)}</h4>
                                        <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-forest-700'}`}>
                                            {formatCurrency(spent)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Debts & Goals Row */}
                <div className="grid grid-cols-2 gap-3 pt-6">
                    {/* Qarzlar (Debts) */}
                    <a href="/debts"
                        className="bg-white rounded-2xl p-4 flex flex-col gap-2 hover:shadow-lg transition-all block"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                    >
                        <span className="text-xs font-semibold text-slate-500">{t('debts.title')}</span>
                        <p className="text-base font-black truncate" style={{ color: '#1a4d3a' }}>
                            -{formatCurrency(debtData.stats?.totalGivenRemaining || 0)}
                        </p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-1" style={{ backgroundColor: '#fff3e0' }}>
                            <span className="text-lg">👋</span>
                        </div>
                    </a>

                    {/* Maqsadlar (Goals) */}
                    <a href="/goals"
                        className="bg-white rounded-2xl p-4 flex flex-col gap-2 hover:shadow-lg transition-all block"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                    >
                        <span className="text-xs font-semibold text-slate-500">{t('goals.title')}</span>
                        <p className="text-base font-black truncate" style={{ color: '#1a4d3a' }}>
                            {totalGoalTarget > 0 ? formatCurrency(totalGoalCollected) : '0 UZS'}
                        </p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-1" style={{ backgroundColor: '#fce4ec' }}>
                            <Target size={18} style={{ color: '#e91e63' }} />
                        </div>
                    </a>
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
                                                        <p className="text-sm font-semibold" style={{ color: '#1a4d3a' }}>{tx.description || t(`categories.${tx.category?.name}`, tx.category?.name) || '-'}</p>
                                                        <p className="text-xs" style={{ color: '#7d4e31' }}>{t(`categories.${tx.category?.name}`, tx.category?.name)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold`} style={{ color: tx.type === 'INCOME' ? '#1e6142' : '#7d4e31' }}>
                                                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
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
            </div >

            {/* Category Modal (Dashboard) */}
            {
                isCatModalOpen && (
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
                )
            }

            {/* Touch Drag Ghost Element */}
            {
                touchDrag.active && (
                    <div
                        style={{
                            position: 'fixed',
                            left: touchDrag.x,
                            top: touchDrag.y,
                            transform: 'translate(-50%, -50%) scale(1.1)',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            background: 'rgba(255,255,255,0.95)',
                            border: '2px solid #1a4d3a',
                            borderRadius: '16px',
                            padding: '10px 15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <div style={{ color: '#1a4d3a' }}>{touchDrag.icon}</div>
                        <span style={{ color: '#1a4d3a', fontWeight: 'bold', fontSize: '13px' }}>{touchDrag.label}</span>
                    </div>
                )
            }
        </>
    );
}
