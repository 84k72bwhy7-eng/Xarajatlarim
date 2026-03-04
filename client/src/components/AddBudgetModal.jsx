import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createBudget, getCategories } from '../lib/api';
import { getCategoryName } from '../lib/categoryTranslations';

export default function AddBudgetModal({ isOpen, onClose, onSuccess }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        amount: '',
        categoryId: '',
    });

    useEffect(() => {
        if (isOpen) {
            getCategories().then(r => setCategories(r.data || [])).catch(() => { });
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
        if (!form.categoryId) {
            alert('Kategoriya tanlanmagan!');
            return;
        }

        setLoading(true);
        try {
            await createBudget({
                amount: parseFloat(form.amount),
                categoryId: form.categoryId
            });
            onSuccess?.();
            onClose();
            setForm({ amount: '', categoryId: '' });
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

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
                        <h2 className="text-base font-bold" style={{ color: '#1a4d3a' }}>{t('budget.addBudget')}</h2>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
                        style={{ backgroundColor: '#f0faf5', color: '#7d4e31' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                    <div>
                        <label style={labelStyle}>{t('transactions.category')}</label>
                        <select name="categoryId" value={form.categoryId} onChange={handleChange} style={inputStyle}>
                            <option value="">{t('transactions.category')}...</option>
                            {categories
                                .filter(c => c.type === 'EXPENSE')
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {getCategoryName(cat.name, i18n.language)}</option>
                                ))}
                        </select>
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
