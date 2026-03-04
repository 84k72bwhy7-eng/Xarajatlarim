import React, { useState } from 'react';
import { Plus, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BudgetsPage() {
    const { t } = useTranslation();
    const [budgets] = useState([
        { id: 1, category: { name: "Oziq-ovqat", icon: "🍔", color: "#10b981" }, amount: 500, spent: 420 },
        { id: 2, category: { name: "Transport", icon: "🚗", color: "#f59e0b" }, amount: 200, spent: 215 },
        { id: 3, category: { name: "O'yin-kulgi", icon: "🍿", color: "#ec4899" }, amount: 150, spent: 50 },
    ]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('budget.title')}</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('budget.limit')}</p>
                </div>
                <button className="bg-indigo-600 text-white rounded-xl p-2.5 shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition">
                    <Plus size={20} />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {budgets.map((budget) => {
                    const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
                    const isOver = budget.spent > budget.amount;
                    const isWarning = percentage >= 80 && !isOver;
                    const isSafe = percentage < 80;

                    return (
                        <div key={budget.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-50 border border-slate-100">
                                        {budget.category.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{budget.category.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium">${budget.amount} / oy</p>
                                    </div>
                                </div>
                                <div className={`p-1.5 rounded-lg ${isOver ? 'bg-rose-50 text-rose-600' : isWarning ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {isOver ? <AlertTriangle size={20} /> : isWarning ? <Target size={20} /> : <CheckCircle2 size={20} />}
                                </div>
                            </div>

                            <div className="space-y-2 relative z-10">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className={isOver ? 'text-rose-600' : 'text-slate-700'}>{t('budget.spent')}: ${budget.spent}</span>
                                    <span className="text-slate-400">{t('budget.remaining')}: ${Math.max(budget.amount - budget.spent, 0)}</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-xs text-slate-400 font-medium">{percentage.toFixed(0)}% {t('budget.limit')}</p>
                            </div>

                            {/* Background gradient hint */}
                            <div className="absolute -bottom-4 -right-4 w-32 h-32 opacity-5 rounded-full blur-2xl" style={{ backgroundColor: budget.category.color }}></div>
                        </div>
                    );
                })}
            </div>

            {/* Umumiy sarhisob */}
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-center gap-4 mt-8">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                    <Target size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-indigo-900">Yaxshi ketyapsiz!</h4>
                    <p className="text-sm text-indigo-700 mt-0.5">Siz umumiy byudjetlaringizning ob'ektiv qismidasiz.</p>
                </div>
            </div>

        </div>
    );
}
