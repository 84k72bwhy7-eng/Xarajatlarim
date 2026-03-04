import React from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SafeToSpend({ data }) {
    const { t } = useTranslation();
    if (!data) return null;

    const { safeTotal, safePerDay, daysLeft, availableBalance, upcomingBills } = data;
    const isHealthy = safeTotal > 0 && upcomingBills < availableBalance * 0.8;

    return (
        <div className="rounded-2xl p-6 relative overflow-hidden"
            style={{
                background: isHealthy
                    ? 'linear-gradient(135deg, #1a4d3a 0%, #2d7a55 100%)'
                    : 'linear-gradient(135deg, #7d4e31 0%, #a06040 100%)',
                boxShadow: isHealthy
                    ? '0 8px 28px rgba(26,77,58,0.4)'
                    : '0 8px 28px rgba(125,78,49,0.4)',
                color: 'white'
            }}>

            {/* Background leaf icon */}
            <div className="absolute -right-4 -top-4 opacity-10">
                <Leaf size={100} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Leaf size={16} className="opacity-80" />
                    <h3 className="font-semibold text-white/90">{t('dashboard.safeToSpend')}</h3>
                </div>

                <div className="mt-4 pb-5 mb-5 border-b border-white/20">
                    <span className="text-4xl font-bold">${Number(safeTotal || 0).toLocaleString()}</span>
                    <span className="text-white/60 ml-2 text-sm">jami</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-white/60 text-xs mb-1">Kunlik limit</p>
                        <p className="text-xl font-bold">${safePerDay}<span className="text-xs font-normal text-white/60 ml-1">/kun</span></p>
                    </div>
                    <div>
                        <p className="text-white/60 text-xs mb-1">Qolgan kunlar</p>
                        <p className="text-xl font-bold">{daysLeft}<span className="text-xs font-normal text-white/60 ml-1">kun</span></p>
                    </div>
                </div>

                <div className="mt-5 rounded-xl p-3.5 flex items-start gap-2.5"
                    style={{ backgroundColor: 'rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {isHealthy
                        ? <ShieldCheck size={18} className="text-green-200 shrink-0 mt-0.5" />
                        : <AlertCircle size={18} className="text-yellow-200 shrink-0 mt-0.5" />}
                    <p className="text-xs text-white/80 leading-relaxed">
                        {isHealthy
                            ? `✅ Yaxshi yo'ldasiz! Kelgusi to'lovlar uchun $${Number(upcomingBills || 0).toLocaleString()} ajratildi.`
                            : `⚠️ Diqqat! Kelgusi to'lovlar ($${Number(upcomingBills || 0).toLocaleString()}) balansingizning katta qismini egallaydi.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
