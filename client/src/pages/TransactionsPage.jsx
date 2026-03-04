import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TransactionsPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('ALL');
    // Mo'k (vaqtinchalik) ma'lumotlar
    const transactions = [
        { id: 1, type: "EXPENSE", amount: 120, category: { name: "Oziq-ovqat", icon: "🍔", color: "#10b981" }, description: "Supermarket", date: new Date().toISOString() },
        { id: 2, type: "EXPENSE", amount: 45, category: { name: "Transport", icon: "🚗", color: "#f59e0b" }, description: "Benzin", date: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, type: "INCOME", amount: 3400, category: { name: "Maosh", icon: "💵", color: "#22c55e" }, description: "Oylik Maosh", date: new Date(Date.now() - 172800000).toISOString() },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{t('transactions.title')}</h1>
                <button className="bg-indigo-600 text-white rounded-xl p-2.5 shadow-sm hover:bg-indigo-700">
                    <Plus size={24} />
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex text-sm font-medium">
                <button className={`flex-1 py-2 rounded-lg transition ${activeTab === 'ALL' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setActiveTab('ALL')}>Barchasi</button>
                <button className={`flex-1 py-2 rounded-lg transition ${activeTab === 'EXPENSE' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setActiveTab('EXPENSE')}>{t('transactions.expense')}</button>
                <button className={`flex-1 py-2 rounded-lg transition ${activeTab === 'INCOME' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setActiveTab('INCOME')}>{t('transactions.income')}</button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-3">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Qidirish..." className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100" />
                    </div>
                    <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {transactions.filter(t => activeTab === 'ALL' || t.type === activeTab).map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition block">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${tx.category.color}20` }}>
                                    {tx.category.icon}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{tx.description}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.category.color }}></span>
                                        {tx.category.name}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount}
                                </p>
                                <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
