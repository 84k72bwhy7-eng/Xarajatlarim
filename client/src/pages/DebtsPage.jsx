import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    HandCoins, Plus, Trash2, Edit2, Loader2, User, Calendar,
    ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, Banknote, X
} from 'lucide-react';
import { getDebts, createDebt, updateDebt, payDebt, deleteDebt } from '../lib/api';

export default function DebtsPage() {
    const { t } = useTranslation();
    const [debts, setDebts] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [showPaid, setShowPaid] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        type: 'GIVEN', personName: '', amount: '', description: '', dueDate: ''
    });

    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payingDebt, setPayingDebt] = useState(null);
    const [payAmount, setPayAmount] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getDebts();
            setDebts(res.data.debts || []);
            setStats(res.data.stats || {});
        } catch (err) {
            console.error('Debts error:', err);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await updateDebt(editing.id, form);
            } else {
                await createDebt(form);
            }
            setIsModalOpen(false);
            setEditing(null);
            setForm({ type: 'GIVEN', personName: '', amount: '', description: '', dueDate: '' });
            loadData();
        } catch (err) {
            alert('Xatolik yuz berdi');
        }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        if (!payingDebt || !payAmount) return;
        try {
            await payDebt(payingDebt.id, parseFloat(payAmount));
            setIsPayModalOpen(false);
            setPayingDebt(null);
            setPayAmount('');
            loadData();
        } catch (err) {
            alert("To'lov kiritishda xato");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('debts.deleteConfirm'))) return;
        try {
            await deleteDebt(id);
            loadData();
        } catch (err) {
            alert("O'chirishda xato");
        }
    };

    const openEdit = (debt) => {
        setEditing(debt);
        setForm({
            type: debt.type,
            personName: debt.personName,
            amount: debt.amount,
            description: debt.description || '',
            dueDate: debt.dueDate ? debt.dueDate.split('T')[0] : ''
        });
        setIsModalOpen(true);
    };

    const openPay = (debt) => {
        setPayingDebt(debt);
        setPayAmount('');
        setIsPayModalOpen(true);
    };

    const filteredDebts = debts.filter(d => {
        if (filter !== 'ALL' && d.type !== filter) return false;
        if (!showPaid && d.isPaid) return false;
        return true;
    });

    const formatNumber = (n) => Number(n || 0).toLocaleString('uz-UZ');
    const getProgress = (d) => d.amount > 0 ? Math.min(Math.round((d.paidAmount / d.amount) * 100), 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-forest-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Stats */}
            <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1a4d3a 0%, #2d7a55 100%)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                        <HandCoins size={22} />
                    </div>
                    <h1 className="text-2xl font-bold">{t('debts.title')}</h1>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowUpRight size={16} className="text-red-300" />
                            <span className="text-xs text-white/60">{t('debts.iGave')}</span>
                        </div>
                        <p className="text-xl font-bold">{formatNumber(stats.totalGivenRemaining)}</p>
                        <p className="text-xs text-white/50">{t('debts.total')}: {formatNumber(stats.totalGiven)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowDownLeft size={16} className="text-green-300" />
                            <span className="text-xs text-white/60">{t('debts.iTook')}</span>
                        </div>
                        <p className="text-xl font-bold">{formatNumber(stats.totalTakenRemaining)}</p>
                        <p className="text-xs text-white/50">{t('debts.total')}: {formatNumber(stats.totalTaken)}</p>
                    </div>
                </div>
            </div>

            {/* Filters + Add */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {[
                        { id: 'ALL', label: t('debts.all') },
                        { id: 'GIVEN', label: t('debts.gave') },
                        { id: 'TAKEN', label: t('debts.took') },
                    ].map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f.id
                                ? 'bg-forest-600 text-white shadow-lg'
                                : 'bg-white text-forest-600 border border-forest-100 hover:bg-forest-50'
                                }`}
                        >{f.label}</button>
                    ))}
                </div>
                <button onClick={() => {
                    setEditing(null);
                    setForm({ type: 'GIVEN', personName: '', amount: '', description: '', dueDate: '' });
                    setIsModalOpen(true);
                }} className="p-2.5 bg-earth-600 text-white rounded-xl shadow-lg hover:bg-earth-700 transition-all hover:scale-110 active:scale-95">
                    <Plus size={20} strokeWidth={3} />
                </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
                <input type="checkbox" checked={showPaid} onChange={e => setShowPaid(e.target.checked)}
                    className="rounded border-forest-300 text-forest-600 focus:ring-forest-500" />
                {t('debts.showPaid')}
            </label>

            {/* Debts List */}
            {filteredDebts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-forest-200">
                    <HandCoins className="mx-auto text-forest-200 mb-3" size={48} />
                    <p className="text-slate-400 text-sm">{t('debts.noDebts')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredDebts.map(debt => {
                        const progress = getProgress(debt);
                        const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && !debt.isPaid;
                        return (
                            <div key={debt.id} className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${debt.isPaid ? 'border-green-100 opacity-70' : isOverdue ? 'border-red-200' : 'border-forest-50'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${debt.type === 'GIVEN' ? 'bg-red-400' : 'bg-green-500'}`}>
                                            {debt.type === 'GIVEN' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-forest-900">{debt.personName}</p>
                                                {debt.isPaid && <CheckCircle2 size={14} className="text-green-500" />}
                                                {isOverdue && <span className="text-xs text-red-500 font-semibold">{t('debts.overdue')}</span>}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {debt.type === 'GIVEN' ? t('debts.iGave') : t('debts.iTook')}
                                                {debt.description && ` • ${debt.description}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-forest-900 text-lg">{formatNumber(debt.amount)}</p>
                                        {debt.paidAmount > 0 && (
                                            <p className="text-xs text-green-600">-{formatNumber(debt.paidAmount)} {t('debts.returned')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>{progress}% {t('debts.returned')}</span>
                                        <span>{t('debts.remaining')}: {formatNumber(debt.amount - debt.paidAmount)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-forest-50 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%`, background: progress >= 100 ? '#22c55e' : 'linear-gradient(90deg, #2d7a55, #1a4d3a)' }} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        {debt.dueDate && (
                                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                                                <Calendar size={12} />
                                                {new Date(debt.dueDate).toLocaleDateString('uz-UZ')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        {!debt.isPaid && (
                                            <button onClick={() => openPay(debt)}
                                                className="px-3 py-1.5 text-xs font-semibold text-white bg-forest-600 rounded-lg hover:bg-forest-700 transition flex items-center gap-1">
                                                <Banknote size={13} /> {t('debts.pay')}
                                            </button>
                                        )}
                                        <button onClick={() => openEdit(debt)} className="p-1.5 text-slate-400 hover:text-earth-600 transition">
                                            <Edit2 size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(debt.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-forest-900">
                                {editing ? t('debts.editDebt') : t('debts.newDebt')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">{t('debts.type')}</label>
                                <div className="flex gap-2">
                                    {[{ id: 'GIVEN', label: t('debts.iGave'), color: '#dc2626' }, { id: 'TAKEN', label: t('debts.iTook'), color: '#16a34a' }].map(tp => (
                                        <button key={tp.id} type="button"
                                            onClick={() => setForm(f => ({ ...f, type: tp.id }))}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${form.type === tp.id
                                                ? 'text-white shadow-lg' : 'bg-[#f0faf5] border-[#dff2ea] text-slate-600 hover:bg-[#e0f0e8]'
                                                }`}
                                            style={form.type === tp.id ? { backgroundColor: tp.color, borderColor: tp.color } : {}}
                                        >{tp.label}</button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">
                                    <User size={13} className="inline mr-1" />{t('debts.personName')}
                                </label>
                                <input type="text" required value={form.personName}
                                    onChange={e => setForm(f => ({ ...f, personName: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">{t('debts.amount')}</label>
                                <input type="number" required min="1" value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">
                                    <Calendar size={13} className="inline mr-1" />{t('debts.dueDate')}
                                </label>
                                <input type="date" value={form.dueDate}
                                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">{t('debts.note')}</label>
                                <input type="text" value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold transition-colors"
                                    style={{ color: '#7d4e31', backgroundColor: '#f0faf5', border: '1px solid #dff2ea' }}>
                                    {t('debts.cancel')}
                                </button>
                                <button type="submit"
                                    className="flex-1 py-3 px-6 text-white rounded-xl font-bold transition-all active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #1a4d3a, #2d7a55)', boxShadow: '0 4px 12px rgba(26,77,58,0.3)' }}>
                                    {t('debts.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pay Modal */}
            {isPayModalOpen && payingDebt && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-forest-900 mb-1">{t('debts.payTitle')}</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            {payingDebt.personName} — {t('debts.remaining')}: {formatNumber(payingDebt.amount - payingDebt.paidAmount)}
                        </p>
                        <form onSubmit={handlePay} className="space-y-4">
                            <input type="number" required min="1"
                                max={payingDebt.amount - payingDebt.paidAmount}
                                value={payAmount}
                                onChange={e => setPayAmount(e.target.value)}
                                placeholder={t('debts.payAmount')}
                                className="w-full px-4 py-3 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500 text-lg font-bold text-center" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsPayModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">
                                    {t('debts.cancel')}
                                </button>
                                <button type="submit"
                                    className="flex-1 py-3 text-white rounded-xl font-bold transition-all active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #1a4d3a, #2d7a55)' }}>
                                    {t('debts.pay')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
