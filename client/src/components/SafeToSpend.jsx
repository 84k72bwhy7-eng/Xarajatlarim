import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SafeToSpend({ data }) {
    const { t } = useTranslation();
    if (!data) return null;

    const { safeTotal, safePerDay, daysLeft, availableBalance, upcomingBills } = data;

    const isHealthy = safeTotal > 0 && upcomingBills < availableBalance * 0.8;
    const isWarning = safeTotal > 0 && upcomingBills >= availableBalance * 0.8;

    return (
        <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden ${isHealthy ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-teal-500' :
                isWarning ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-orange-400' :
                    'bg-gradient-to-br from-rose-500 to-red-600 border-red-500'
            }`}>
            <div className="absolute -right-6 -top-6 text-white/10">
                <ShieldCheck size={120} />
            </div>

            <div className="relative z-10 text-white">
                <div className="flex items-center gap-2 mb-1">
                    <Zap size={18} className="text-white/80" />
                    <h3 className="font-semibold text-white/90">{t('dashboard.safeToSpend')}</h3>
                </div>

                <div className="mt-4 flex items-end gap-3 border-b border-white/20 pb-6 mb-6">
                    <div>
                        <span className="text-4xl font-bold tracking-tight">${Number(safeTotal || 0).toLocaleString()}</span>
                        <span className="text-white/70 ml-2 font-medium">{t('transactions.amount')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-white/70 text-sm mb-1">{t('dashboard.safeToSpend')}/kun</p>
                        <p className="text-2xl font-semibold">${safePerDay}<span className="text-sm font-normal text-white/70"> /day</span></p>
                    </div>
                    <div>
                        <p className="text-white/70 text-sm mb-1">Qolgan kunlar</p>
                        <p className="text-2xl font-semibold">{daysLeft}<span className="text-sm font-normal text-white/70"> kun</span></p>
                    </div>
                </div>

                <div className="mt-6 bg-black/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 flex items-start gap-3">
                    {isHealthy ? (
                        <ShieldCheck size={20} className="text-emerald-200 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle size={20} className="text-white shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm text-white/90 leading-relaxed">
                        {isHealthy
                            ? `✅ Yaxshi yo'ldasiz! Kelgusi to'lovlar uchun $${Number(upcomingBills || 0).toLocaleString()} ajratildi.`
                            : `⚠️ Ehtiyot bo'ling! Kelgusi to'lovlar ($${Number(upcomingBills || 0).toLocaleString()}) balansingizning katta qismini egallaydi.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
