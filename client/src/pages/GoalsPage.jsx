import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Target, Plus, Trash2, Edit2, Loader2, Calendar,
    CheckCircle2, TrendingUp, Coins, X, Sparkles
} from 'lucide-react';
import { getGoals, createGoal, updateGoal, addToGoal, deleteGoal } from '../lib/api';

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '📱', '💻', '👗', '💍', '🎓', '💰', '🏖️', '🎮', '📚', '🏋️', '🎵'];

export default function GoalsPage() {
    const { t } = useTranslation();
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCompleted, setShowCompleted] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        name: '', targetAmount: '', icon: '🎯', color: '#2d7a55', deadline: ''
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addingGoal, setAddingGoal] = useState(null);
    const [addAmount, setAddAmount] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getGoals();
            setGoals(res.data.goals || []);
            setStats(res.data.stats || {});
        } catch (err) {
            console.error('Goals error:', err);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await updateGoal(editing.id, form);
            } else {
                await createGoal(form);
            }
            setIsModalOpen(false);
            setEditing(null);
            setForm({ name: '', targetAmount: '', icon: '🎯', color: '#2d7a55', deadline: '' });
            loadData();
        } catch (err) {
            alert('Xatolik yuz berdi');
        }
    };

    const handleAddMoney = async (e) => {
        e.preventDefault();
        if (!addingGoal || !addAmount) return;
        try {
            await addToGoal(addingGoal.id, parseFloat(addAmount));
            setIsAddModalOpen(false);
            setAddingGoal(null);
            setAddAmount('');
            loadData();
        } catch (err) {
            alert("Pul qo'shishda xato");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('goals.deleteConfirm'))) return;
        try {
            await deleteGoal(id);
            loadData();
        } catch (err) {
            alert("O'chirishda xato");
        }
    };

    const openEdit = (goal) => {
        setEditing(goal);
        setForm({
            name: goal.name,
            targetAmount: goal.targetAmount,
            icon: goal.icon,
            color: goal.color,
            deadline: goal.deadline ? goal.deadline.split('T')[0] : ''
        });
        setIsModalOpen(true);
    };

    const openAddMoney = (goal) => {
        setAddingGoal(goal);
        setAddAmount('');
        setIsAddModalOpen(true);
    };

    const filteredGoals = goals.filter(g => showCompleted || !g.isCompleted);
    const formatNumber = (n) => Number(n || 0).toLocaleString('uz-UZ');
    const getProgress = (g) => g.targetAmount > 0 ? Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100) : 0;

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
            <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #7d4e31 0%, #a06040 50%, #c4956a 100%)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                        <Target size={22} />
                    </div>
                    <h1 className="text-2xl font-bold">{t('goals.title')}</h1>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                        <p className="text-2xl font-bold">{stats.activeCount || 0}</p>
                        <p className="text-xs text-white/60">{t('goals.active')}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                        <p className="text-2xl font-bold">{stats.overallProgress || 0}%</p>
                        <p className="text-xs text-white/60">{t('goals.overall')}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                        <p className="text-2xl font-bold">{stats.completedCount || 0}</p>
                        <p className="text-xs text-white/60">{t('goals.completed')}</p>
                    </div>
                </div>
                <div className="mt-3 bg-white/10 rounded-xl p-3 border border-white/10">
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>{t('goals.collected')}: {formatNumber(stats.totalSaved)}</span>
                        <span>{t('goals.target')}: {formatNumber(stats.totalTarget)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${stats.overallProgress || 0}%`, background: 'linear-gradient(90deg, #f5e6d0, #ffffff)' }} />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
                    <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)}
                        className="rounded border-forest-300 text-forest-600 focus:ring-forest-500" />
                    {t('goals.showCompleted')}
                </label>
                <button onClick={() => {
                    setEditing(null);
                    setForm({ name: '', targetAmount: '', icon: '🎯', color: '#2d7a55', deadline: '' });
                    setIsModalOpen(true);
                }} className="p-2.5 bg-earth-600 text-white rounded-xl shadow-lg hover:bg-earth-700 transition-all hover:scale-110 active:scale-95">
                    <Plus size={20} strokeWidth={3} />
                </button>
            </div>

            {/* Goals List */}
            {filteredGoals.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-forest-200">
                    <Target className="mx-auto text-forest-200 mb-3" size={48} />
                    <p className="text-slate-400 text-sm">{t('goals.noGoals')}</p>
                    <p className="text-xs text-slate-300 mt-1">{t('goals.firstGoal')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredGoals.map(goal => {
                        const progress = getProgress(goal);
                        const remaining = goal.targetAmount - goal.savedAmount;
                        const isExpired = goal.deadline && new Date(goal.deadline) < new Date() && !goal.isCompleted;
                        return (
                            <div key={goal.id} className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${goal.isCompleted ? 'border-green-100' : isExpired ? 'border-orange-200' : 'border-forest-50'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                                            style={{ backgroundColor: `${goal.color}15` }}>
                                            {goal.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-forest-900">{goal.name}</p>
                                                {goal.isCompleted && (
                                                    <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                                                        <Sparkles size={12} /> {t('goals.achieved')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                {goal.deadline && (
                                                    <span className={`flex items-center gap-1 ${isExpired ? 'text-orange-500' : ''}`}>
                                                        <Calendar size={11} />
                                                        {new Date(goal.deadline).toLocaleDateString('uz-UZ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{t('goals.target')}</p>
                                        <p className="font-bold text-forest-900">{formatNumber(goal.targetAmount)}</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-forest-600 font-semibold">{formatNumber(goal.savedAmount)} {t('goals.collected').toLowerCase()}</span>
                                        <span className={`font-bold ${progress >= 100 ? 'text-green-500' : 'text-slate-400'}`}>{progress}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-forest-50 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${progress}%`,
                                                background: progress >= 100
                                                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                                    : `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)`
                                            }} />
                                    </div>
                                    {!goal.isCompleted && (
                                        <p className="text-xs text-slate-400 mt-1">{t('goals.needMore').replace('{{amount}}', formatNumber(remaining > 0 ? remaining : 0))}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-1">
                                    {!goal.isCompleted && (
                                        <button onClick={() => openAddMoney(goal)}
                                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition flex items-center gap-1"
                                            style={{ background: goal.color }}>
                                            <Coins size={13} /> {t('goals.addMoney')}
                                        </button>
                                    )}
                                    <button onClick={() => openEdit(goal)} className="p-1.5 text-slate-400 hover:text-earth-600 transition">
                                        <Edit2 size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition">
                                        <Trash2 size={15} />
                                    </button>
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
                                {editing ? t('goals.editGoal') : t('goals.newGoal')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">{t('goals.name')}</label>
                                <input type="text" required value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">{t('goals.targetAmount')}</label>
                                <input type="number" required min="1" value={form.targetAmount}
                                    onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">{t('goals.icon')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {GOAL_ICONS.map(icon => (
                                        <button key={icon} type="button"
                                            onClick={() => setForm(f => ({ ...f, icon }))}
                                            className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon
                                                ? 'bg-forest-100 ring-2 ring-forest-500 scale-110'
                                                : 'bg-forest-50 hover:bg-forest-100'
                                                }`}
                                        >{icon}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-forest-800 mb-1">{t('goals.color')}</label>
                                    <input type="color" value={form.color}
                                        onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                                        className="w-full h-[46px] p-1 bg-forest-50 border border-forest-100 rounded-xl outline-none cursor-pointer" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-forest-800 mb-1">{t('goals.deadline')}</label>
                                    <input type="date" value={form.deadline}
                                        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500 text-sm" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold transition-colors"
                                    style={{ color: '#7d4e31', backgroundColor: '#f0faf5', border: '1px solid #dff2ea' }}>
                                    {t('goals.cancel')}
                                </button>
                                <button type="submit"
                                    className="flex-1 py-3 px-6 text-white rounded-xl font-bold transition-all active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #7d4e31, #a06040)', boxShadow: '0 4px 12px rgba(125,78,49,0.3)' }}>
                                    {t('goals.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Money Modal */}
            {isAddModalOpen && addingGoal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-forest-900 mb-1">{t('goals.addMoneyTitle')}</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            {addingGoal.icon} {addingGoal.name}
                        </p>
                        <form onSubmit={handleAddMoney} className="space-y-4">
                            <input type="number" required min="1" value={addAmount}
                                onChange={e => setAddAmount(e.target.value)}
                                placeholder={t('debts.amount')}
                                className="w-full px-4 py-3 bg-forest-50 border border-forest-100 rounded-xl outline-none focus:ring-2 focus:ring-forest-500 text-lg font-bold text-center" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">
                                    {t('goals.cancel')}
                                </button>
                                <button type="submit"
                                    className="flex-1 py-3 text-white rounded-xl font-bold transition-all active:scale-95"
                                    style={{ background: `linear-gradient(135deg, ${addingGoal.color}, ${addingGoal.color}cc)` }}>
                                    {t('goals.addMoney')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
