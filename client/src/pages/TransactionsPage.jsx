import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Leaf, Trash2, ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTransactions, deleteTransaction } from '../lib/api';
import AddTransactionModal from '../components/AddTransactionModal';
import { getCategoryName } from '../lib/categoryTranslations';
import { formatCurrency } from '../lib/format';

export default function TransactionsPage() {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('ALL');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await getTransactions();
            setTransactions(res.data?.transactions || res.data || []);
        } catch (err) {
            console.error('Transactions fetch error:', err);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('common.confirmDelete') || "Rostdan ham o'chirmoqchimisiz?")) return;
        try {
            await deleteTransaction(id);
            fetchTransactions();
        } catch (err) {
            console.error('Delete transaction error:', err);
            alert(err.response?.data?.error || "Xatolik yuz berdi");
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    const filtered = transactions.filter(tx => {
        const matchesTab = activeTab === 'ALL' || tx.type === activeTab;
        const matchesSearch = !searchQuery ||
            (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const tabs = [
        { val: 'ALL', label: 'Barchasi' },
        { val: 'EXPENSE', label: t('transactions.expense') },
        { val: 'INCOME', label: t('transactions.income') },
        { val: 'TRANSFER', label: t('transactions.transfer') },
    ];

    return (
        <>
            <AddTransactionModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={fetchTransactions} />

            <div className="space-y-5 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold" style={{ color: '#1a4d3a' }}>{t('transactions.title')}</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #1a4d3a, #2d7a55)', boxShadow: '0 4px 12px rgba(26,77,58,0.3)' }}
                    >
                        <Plus size={18} />
                        {t('transactions.addTransaction')}
                    </button>
                </div>

                {/* Tabs */}
                <div className="rounded-2xl p-1 flex"
                    style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(26,77,58,0.06)' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.val}
                            onClick={() => setActiveTab(tab.val)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={activeTab === tab.val
                                ? { background: 'linear-gradient(135deg, #1a4d3a, #2d7a55)', color: 'white', boxShadow: '0 2px 8px rgba(26,77,58,0.25)' }
                                : { color: '#7d4e31' }
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search + List */}
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 16px rgba(26,77,58,0.08)' }}>
                    <div className="p-4 border-b" style={{ borderColor: '#f0faf5' }}>
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#a06040' }} />
                            <input
                                type="text"
                                placeholder={`${t('transactions.description')}...`}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                                style={{ backgroundColor: '#f0faf5', color: '#1a4d3a', border: '1px solid #e0f0e8' }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-14 flex items-center justify-center">
                            <Loader2 size={28} className="animate-spin" style={{ color: '#2d7a55' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-14 text-center">
                            <Leaf size={36} className="mx-auto mb-3 opacity-20" style={{ color: '#1a4d3a' }} />
                            <p className="text-sm" style={{ color: '#7d4e31' }}>{t('dashboard.noTransactions')}</p>
                            <button onClick={() => setShowModal(true)} className="mt-3 text-sm font-semibold hover:opacity-70 transition" style={{ color: '#2d7a55' }}>
                                + {t('transactions.addTransaction')}
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: '#f0faf5' }}>
                            {filtered.map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#f7fcf9] transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                                            style={{ backgroundColor: tx.type === 'TRANSFER' ? '#e0f2fe' : `${tx.category?.color || '#2d7a55'}15` }}>
                                            {tx.type === 'TRANSFER' ? <ArrowRightLeft size={20} style={{ color: '#0284c7' }} /> : (tx.category?.icon || (tx.type === 'INCOME' ? '💵' : '💸'))}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: '#1a4d3a' }}>
                                                {tx.type === 'TRANSFER'
                                                    ? (tx.description || t('transactions.transfer'))
                                                    : (tx.description || tx.category?.name || '-')}
                                            </p>
                                            {tx.type === 'TRANSFER' ? (
                                                <p className="text-xs flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#0284c7' }}></span>
                                                    <span style={{ color: '#0284c7' }}>{tx.account?.name} → {tx.transferToAccount?.name || t('transactions.targetAccount')}</span>
                                                </p>
                                            ) : tx.category && (
                                                <p className="text-xs flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tx.category.color }}></span>
                                                    <span style={{ color: '#a06040' }}>{getCategoryName(tx.category.name, i18n.language)}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold" style={{ color: tx.type === 'INCOME' ? '#1e6142' : tx.type === 'TRANSFER' ? '#0284c7' : '#7d4e31' }}>
                                            {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '' : '-'}{formatCurrency(tx.amount)}
                                        </p>
                                        <div className="flex items-center justify-end gap-2 mt-0.5">
                                            <p className="text-xs" style={{ color: '#a06040' }}>
                                                {new Date(tx.date).toLocaleDateString()}
                                            </p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="O'chirish"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
