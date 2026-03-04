import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTransactions } from '../lib/api';
import AddTransactionModal from '../components/AddTransactionModal';
import { getCategoryName } from '../lib/categoryTranslations';

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
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filtered = transactions.filter(tx => {
        const matchesTab = activeTab === 'ALL' || tx.type === activeTab;
        const matchesSearch = !searchQuery ||
            (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <>
            <AddTransactionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchTransactions}
            />

            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{t('transactions.title')}</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 shadow-sm hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
                    >
                        <Plus size={18} />
                        {t('transactions.addTransaction')}
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex text-sm font-medium">
                    {[['ALL', 'Barchasi'], ['EXPENSE', t('transactions.expense')], ['INCOME', t('transactions.income')]].map(([val, label]) => (
                        <button
                            key={val}
                            className={`flex-1 py-2 rounded-lg transition ${activeTab === val
                                ? val === 'EXPENSE' ? 'bg-rose-50 text-rose-700' : val === 'INCOME' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            onClick={() => setActiveTab(val)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex gap-3">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={`${t('transactions.description')}...`}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                    </div>

                    {/* List */}
                    {loading ? (
                        <div className="py-16 flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-indigo-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <p>{t('dashboard.noTransactions')}</p>
                            <button onClick={() => setShowModal(true)} className="mt-4 text-indigo-600 font-medium hover:underline text-sm">
                                + {t('transactions.addTransaction')}
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                            style={{ backgroundColor: `${tx.category?.color || '#6366f1'}20` }}>
                                            {tx.category?.icon || (tx.type === 'INCOME' ? '💵' : '💸')}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{tx.description || tx.category?.name || '-'}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                {tx.category && (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.category.color }}></span>
                                                        {getCategoryName(tx.category.name, i18n.language)}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
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
