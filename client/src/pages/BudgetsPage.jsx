import React, { useState, useEffect } from 'react';
import { Plus, Target, AlertTriangle, CheckCircle2, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBudgets } from '../lib/api';
import AddBudgetModal from '../components/AddBudgetModal';

export default function BudgetsPage() {
    const { t } = useTranslation();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const res = await getBudgets();
            setBudgets(res.data || []);
        } catch (err) {
            console.error("Failed to load budgets", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1a4d3a' }}>{t('budget.title')}</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#7d4e31' }}>{t('budget.limit')}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #1a4d3a, #2d7a55)', boxShadow: '0 4px 12px rgba(26,77,58,0.3)' }}
                >
                    <Plus size={18} />
                    {t('budget.addBudget')}
                </button>
            </div>
            <AddBudgetModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={fetchBudgets} />

            {/* Budget Cards */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Leaf size={28} className="text-white animate-pulse" style={{ color: '#1a4d3a' }} />
                </div>
            ) : (
                <div className="space-y-4">
                    {budgets.map((budget) => {
                        const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
                        const isOver = budget.spent > budget.amount;
                        const isWarning = percentage >= 80 && !isOver;

                        const statusColor = isOver ? '#a06040' : isWarning ? '#bf7c55' : '#2d7a55';
                        const barColor = isOver ? '#a06040' : isWarning ? '#bf7c55' : '#2d7a55';
                        const StatusIcon = isOver ? AlertTriangle : isWarning ? AlertTriangle : CheckCircle2;

                        return (
                            <div key={budget.id} className="rounded-2xl p-5 relative overflow-hidden"
                                style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 16px rgba(26,77,58,0.08)', border: '1px solid #f0faf5' }}>

                                {/* Background accent */}
                                <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-2xl"
                                    style={{ backgroundColor: budget.category.color }} />

                                <div className="pl-2">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                                                style={{ backgroundColor: `${budget.category.color}18` }}>
                                                {budget.category.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold" style={{ color: '#1a4d3a' }}>{budget.category.name}</h3>
                                                <p className="text-xs" style={{ color: '#a06040' }}>${budget.amount} {t('budget.limit')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <StatusIcon size={20} style={{ color: statusColor }} />
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span style={{ color: isOver ? '#a06040' : '#1a4d3a' }}>
                                                {t('budget.spent')}: ${budget.spent}
                                            </span>
                                            <span style={{ color: '#7d4e31' }}>
                                                {t('budget.remaining')}: ${Math.max(budget.amount - budget.spent, 0)}
                                            </span>
                                        </div>
                                        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0faf5' }}>
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                                            />
                                        </div>
                                        <p className="text-right text-xs font-medium" style={{ color: '#a06040' }}>
                                            {percentage.toFixed(0)}% {t('budget.limit')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && budgets.length === 0 && (
                <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#ffffff' }}>
                    <Leaf size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#1a4d3a' }} />
                    <p style={{ color: '#7d4e31' }}>{t('budget.noBudgets')}</p>
                </div>
            )}
        </div>
    );
}
