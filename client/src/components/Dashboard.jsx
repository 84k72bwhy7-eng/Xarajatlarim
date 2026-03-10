import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Wallet, HandCoins, Target, Leaf,
    Activity, ArrowUpRight, ArrowDownLeft, ChevronRight, ChevronLeft, ChevronDown, Globe, ArrowRightLeft
} from 'lucide-react';
import CashflowChart from './CashflowChart';
import CategoryPieChart from './CategoryPieChart';
import SafeToSpend from './SafeToSpend';
import AddTransactionModal from './AddTransactionModal';
import { getDashboardSummary, getDebts, getGoals, getAccounts } from '../lib/api';
import { formatCurrency } from '../lib/format';

export default function Dashboard({ tgUser }) {
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTxModal, setShowTxModal] = useState(false);
    const [txInitialData, setTxInitialData] = useState({});

    // Horizontal Scroll Ref for Accounts
    const scrollRef = useRef(null);
    const scrollLeft = () => {
        if (scrollRef.current) scrollRef.current.scrollBy({ left: -160, behavior: 'smooth' });
    };
    const scrollRight = () => {
        if (scrollRef.current) scrollRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    };

    // Touch Drag State
    const [touchDrag, setTouchDrag] = useState({ active: false, type: null, x: 0, y: 0, label: '', icon: null, accountId: null });

    // Summary Data States
    const [debtData, setDebtData] = useState({ debts: [], stats: {} });
    const [goalData, setGoalData] = useState({ goals: [], stats: {} });



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
    const handleTouchStart = (e, type, label, icon, accountId = null) => {
        const touch = e.touches[0];
        setTouchDrag({
            active: true,
            type,
            x: touch.clientX,
            y: touch.clientY,
            label,
            icon,
            accountId
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
        const dragAccountId = touchDrag.accountId;
        setTouchDrag({ active: false, type: null, x: 0, y: 0, label: '', icon: null, accountId: null });

        // Find drop target
        const element = document.elementFromPoint(x, y);
        if (!element) return;

        const dropTarget = element.closest('[data-drop-target]');
        if (!dropTarget) return;

        const targetType = dropTarget.getAttribute('data-drop-type');
        const targetId = dropTarget.getAttribute('data-drop-id');

        if (touchDrag.type === 'add' && targetType === 'wallet') {
            setTxInitialData({ type: 'INCOME', accountId: targetId });
            setShowTxModal(true);
        } else if (touchDrag.type === 'wallet' && targetType === 'category') {
            setTxInitialData({ type: 'EXPENSE', categoryId: targetId, accountId: dragAccountId });
            setShowTxModal(true);
        } else if (touchDrag.type === 'wallet' && targetType === 'wallet' && dragAccountId && targetId && dragAccountId !== targetId) {
            // Account → Account transfer (touch)
            setTxInitialData({ type: 'TRANSFER', accountId: dragAccountId, transferToAccountId: targetId });
            setShowTxModal(true);
        }
    };

    useEffect(() => { fetchData(); }, [fetchData]);



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
                <div className="relative group">
                    {/* Scroll Left Button */}
                    <button
                        onClick={scrollLeft}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 sm:-ml-4 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center z-10 transition-transform active:scale-95"
                        style={{ color: '#1a4d3a', border: '1px solid #dff2ea' }}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div ref={scrollRef} className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x scroll-smooth w-full">
                        {/* Individual Accounts */}
                        {accounts.map(acc => (
                            <div
                                key={acc.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('type', 'wallet');
                                    e.dataTransfer.setData('accountId', acc.id);
                                }}
                                onTouchStart={(e) => handleTouchStart(e, 'wallet', acc.name, <Wallet size={20} />, acc.id)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    const dragType = e.dataTransfer.getData('type');
                                    if (dragType === 'add') {
                                        e.preventDefault();
                                        setTxInitialData({ type: 'INCOME', accountId: acc.id });
                                        setShowTxModal(true);
                                    } else if (dragType === 'wallet') {
                                        e.preventDefault();
                                        const sourceAccountId = e.dataTransfer.getData('accountId');
                                        if (sourceAccountId && sourceAccountId !== acc.id) {
                                            setTxInitialData({ type: 'TRANSFER', accountId: sourceAccountId, transferToAccountId: acc.id });
                                            setShowTxModal(true);
                                        }
                                    }
                                }}
                                data-drop-target
                                data-drop-type="wallet"
                                data-drop-id={acc.id}
                                className="bg-white rounded-2xl p-3 flex flex-col gap-1 transition-all cursor-grab active:cursor-grabbing touch-none min-w-[105px] max-w-[130px] flex-1 snap-start relative overflow-hidden"
                                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                            >
                                <span className="text-xs font-semibold text-slate-500 truncate z-10">{acc.name}</span>
                                <p className="text-sm sm:text-base font-black truncate z-10" style={{ color: '#1a4d3a' }}>{formatCurrency(acc.balance)}</p>

                                {/* Icon rendering logic */}
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mt-2 z-10" style={{ backgroundColor: `${acc.color || '#2d7a55'}15` }}>
                                    {acc.icon === 'wallet' ? <Wallet size={16} style={{ color: acc.color || '#2d7a55' }} /> : (
                                        <span className="text-base">{acc.icon && acc.icon !== 'wallet' ? acc.icon : <Wallet size={16} style={{ color: acc.color || '#2d7a55' }} />}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add Account Button */}
                        <a href="/profile" className="bg-slate-50/50 rounded-2xl p-3 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all min-w-[105px] max-w-[130px] flex-1 snap-start group">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 transition-transform group-hover:scale-110" style={{ backgroundColor: '#2d7a55' }}>
                                <Plus size={18} strokeWidth={3} />
                            </div>
                            <span className="text-xs font-bold text-slate-500">{t('profile.accounts')}</span>
                        </a>
                    </div>

                    {/* Scroll Right Button */}
                    <button
                        onClick={scrollRight}
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 sm:-mr-4 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center z-10 transition-transform active:scale-95"
                        style={{ color: '#1a4d3a', border: '1px solid #dff2ea' }}
                    >
                        <ChevronRight size={18} />
                    </button>
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
                                    onClick={() => { setTxInitialData({ type: 'EXPENSE', categoryId: cat.id }); setShowTxModal(true); }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        if (e.dataTransfer.getData('type') === 'wallet') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const accountId = e.dataTransfer.getData('accountId');
                                            setTxInitialData({ type: 'EXPENSE', categoryId: cat.id, accountId });
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
                                                        style={{ backgroundColor: tx.type === 'TRANSFER' ? '#e0f2fe' : `${tx.category?.color || '#2d7a55'}18` }}>
                                                        {tx.type === 'TRANSFER' ? <ArrowRightLeft size={18} style={{ color: '#0284c7' }} /> : (tx.category?.icon || (tx.type === 'INCOME' ? '💵' : '💸'))}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold" style={{ color: '#1a4d3a' }}>
                                                            {tx.type === 'TRANSFER'
                                                                ? (tx.description || t('transactions.transfer'))
                                                                : (tx.description || t(`categories.${tx.category?.name}`, tx.category?.name) || '-')}
                                                        </p>
                                                        <p className="text-xs" style={{ color: tx.type === 'TRANSFER' ? '#0284c7' : '#7d4e31' }}>
                                                            {tx.type === 'TRANSFER'
                                                                ? `${tx.account?.name} → ${tx.transferToAccount?.name || ''}`
                                                                : t(`categories.${tx.category?.name}`, tx.category?.name)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold`} style={{ color: tx.type === 'INCOME' ? '#1e6142' : tx.type === 'TRANSFER' ? '#0284c7' : '#7d4e31' }}>
                                                        {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '' : '-'}{formatCurrency(tx.amount)}
                                                    </p>
                                                    <p className="text-xs" style={{ color: '#a06040' }}>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
