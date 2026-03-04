import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Leaf } from 'lucide-react';
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
            getCategories().then(r => setCategories(r.data || [])).catch(() => { });
            getAccounts().then(r => {
                const accs = r.data || [];
                setAccounts(accs);
                if (accs.length > 0) {
                    setForm(prev => ({ ...prev, account: accs[0].id }));
                }
            }).catch(() => { });
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
        if (!form.account) {
            alert('Hisob tanlanmagan!');
            return;
        }
        setLoading(true);
        try {
            await createTransaction({
                type: form.type,
                amount: parseFloat(form.amount),
                categoryId: form.category || undefined,
                accountId: form.account,
                date: new Date(form.date).toISOString(),
                description: form.description || undefined,
            });
            onSuccess?.();
            onClose();
            setForm({
                type: 'EXPENSE',
                amount: '',
                category: '',
                account: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
            });
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const typeOptions = [
        { value: 'EXPENSE', label: t('transactions.expense'), active: '#a06040', bg: 'linear-gradient(135deg, #7d4e31, #a06040)' },
        { value: 'INCOME', label: t('transactions.income'), active: '#2d7a55', bg: 'linear-gradient(135deg, #1a4d3a, #2d7a55)' },
        { value: 'TRANSFER', label: t('transactions.transfer'), active: '#3a9669', bg: 'linear-gradient(135deg, #1e6142, #3a9669)' },
    ];

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        outline: 'none',
        fontFamily: 'Geologica, sans-serif',
        backgroundColor: '#f7fcf9',
        border: '1.5px solid #dff2ea',
        color: '#1a4d3a',
    };

    const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#7d4e31' };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(13, 43, 30, 0.6)', backdropFilter: 'blur(4px)' }} />

            <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
                style={{ backgroundColor: '#ffffff', boxShadow: '0 -8px 40px rgba(26,77,58,0.3), 0 20px 60px rgba(0,0,0,0.2)' }}
                onClick={e => e.stopPropagation()}>

                {/* Pull bar (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#dff2ea' }}></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0faf5' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f0faf5' }}>
                            <Leaf size={16} style={{ color: '#1a4d3a' }} />
                        </div>
                        <h2 className="text-base font-bold" style={{ color: '#1a4d3a' }}>{t('transactions.addTransaction')}</h2>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
                        style={{ backgroundColor: '#f0faf5', color: '#7d4e31' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Type */}
                    <div>
                        <label style={labelStyle}>{t('transactions.type')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {typeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, type: opt.value }))}
                                    className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                                    style={form.type === opt.value
                                        ? { background: opt.bg, color: 'white', boxShadow: `0 4px 12px ${opt.active}50` }
                                        : { backgroundColor: '#f0faf5', color: '#7d4e31' }
                                    }
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label style={labelStyle}>{t('transactions.amount')}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: '#a06040' }}>$</span>
                            <input type="number" name="amount" value={form.amount} onChange={handleChange}
                                required min="0.01" step="any" placeholder="0.00"
                                style={{ ...inputStyle, paddingLeft: '32px' }} />
                        </div>
                    </div>

                    {/* Category */}
                    {form.type !== 'TRANSFER' && (
                        <div>
                            <label style={labelStyle}>{t('transactions.category')}</label>
                            <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
                                <option value="">{t('transactions.category')}...</option>
                                {categories
                                    .filter(c => form.type === 'ALL' || c.type === form.type || c.type === ('EXPENSE' === form.type ? 'EXPENSE' : 'INCOME'))
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {getCategoryName(cat.name, i18n.language)}</option>
                                    ))}
                            </select>
                        </div>
                    )}

                    {/* Account */}
                    {accounts.length > 0 && (
                        <div>
                            <label style={labelStyle}>{t('transactions.account')}</label>
                            <select name="account" value={form.account} onChange={handleChange} style={inputStyle}>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} — ${Number(acc.balance).toLocaleString()}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label style={labelStyle}>{t('transactions.date')}</label>
                        <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={labelStyle}>{t('transactions.description')}</label>
                        <input type="text" name="description" value={form.description} onChange={handleChange}
                            placeholder={t('transactions.description')} style={inputStyle} />
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #1a4d3a, #2d7a55)', color: 'white', boxShadow: '0 4px 16px rgba(26,77,58,0.35)' }}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        {loading ? t('app.loading') : t('transactions.save')}
                    </button>
                </form>
            </div>
        </div>
    );
}
