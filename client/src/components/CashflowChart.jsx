import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function CashflowChart({ data }) {
    const { t } = useTranslation();

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload?.length) {
            return (
                <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: '#1a4d3a', color: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                    <p className="font-semibold mb-1 text-white/80">{label}</p>
                    {payload.map(p => (
                        <p key={p.name} style={{ color: p.color }}>
                            {p.name}: ${Number(p.value).toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 16px rgba(26,77,58,0.08)' }}>
            <h3 className="text-base font-bold mb-6 flex items-center gap-2" style={{ color: '#1a4d3a' }}>
                <span className="w-2 h-6 rounded-full inline-block" style={{ backgroundColor: '#2d7a55' }}></span>
                {t('dashboard.sixMonthsCashflow')}
            </h3>
            {!data || data.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#a06040' }}>
                    {t('dashboard.noTransactions')}
                </div>
            ) : (
                <div className="w-full min-h-[280px]">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0faf5" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7d4e31', fontSize: 11, fontFamily: 'Geologica' }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7d4e31', fontSize: 11, fontFamily: 'Geologica' }} tickFormatter={v => `$${v / 1000}k`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0faf5' }} />
                            <Legend wrapperStyle={{ paddingTop: '16px', fontFamily: 'Geologica', fontSize: '12px', color: '#1a4d3a' }} iconType="circle" />
                            <Bar dataKey="income" name={t('transactions.income')} fill="#2d7a55" radius={[6, 6, 0, 0]} barSize={28} />
                            <Bar dataKey="expense" name={t('transactions.expense')} fill="#a06040" radius={[6, 6, 0, 0]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
