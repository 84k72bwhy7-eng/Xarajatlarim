import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createTransaction, getCategories, getAccounts } from '../lib/api';
import { getCategoryName } from '../lib/categoryTranslations';

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({
        type: 'EXPENSE',
        amount: '',
        category: '',
        account: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
    });

    useEffect(() => {
        if (isOpen) {
            getCategories().then(r => setCategories(r.data)).catch(() => { });
            getAccounts().then(r => setAccounts(r.data)).catch(() => { });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) {
            alert(t('transactions.amount') + ' kiritilmagan!');
            return;
        }
        setLoading(true);
        try {
            await createTransaction({
                type: form.type,
                amount: parseFloat(form.amount),
                categoryId: form.category ? parseInt(form.category) : undefined,
                accountId: form.account ? parseInt(form.account) : undefined,
                date: new Date(form.date).toISOString(),
                description: form.description || undefined,
            });
            onSuccess?.();
            onClose();
            // Reset form
            setForm({
                type: 'EXPENSE',
                amount: '',
                category: '',
                account: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
            });
        } catch (err) {
            alert(err.response?.data?.error || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const typeOptions = [
        { value: 'EXPENSE', label: t('transactions.expense'), color: 'from-rose-500 to-red-500' },
        { value: 'INCOME', label: t('transactions.income'), color: 'from-emerald-500 to-teal-500' },
        { value: 'TRANSFER', label: t('transactions.transfer'), color: 'from-blue-500 to-indigo-500' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">{t('transactions.addTransaction')}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Type selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">{t('transactions.type')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {typeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, type: opt.value }))}
                                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${form.type === opt.value
                                        ? `bg-gradient-to-r ${opt.color} text-white shadow-md`
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('transactions.amount')}</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                            <input
                                type="number"
                                name="amount"
                                value={form.amount}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    {form.type !== 'TRANSFER' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('transactions.category')}</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                            >
                                <option value="">{t('transactions.category')}...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {getCategoryName(cat.name, i18n.language)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Account */}
                    {accounts.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('transactions.account')}</label>
                            <select
                                name="account"
                                value={form.account}
                                onChange={handleChange}
                                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                            >
                                <option value="">{t('transactions.account')}...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('transactions.date')}</label>
                        <input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('transactions.description')}</label>
                        <input
                            type="text"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder={t('transactions.description')}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                        {loading ? t('app.loading') : t('transactions.save')}
                    </button>
                </form>
            </div>
        </div>
    );
}
