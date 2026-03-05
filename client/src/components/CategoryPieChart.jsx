import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const NATURE_COLORS = ['#1a4d3a', '#7d4e31', '#2d7a55', '#a06040', '#3a9669', '#bf7c55', '#52b082', '#d4987a'];

export default function CategoryPieChart({ data }) {
    const { t } = useTranslation();
    const colors = data.map((d, i) => d.color || NATURE_COLORS[i % NATURE_COLORS.length]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload?.length) {
            return (
                <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: '#1a4d3a', color: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' }}>
                    <p className="font-semibold">{t(`categories.${payload[0].name}`, payload[0].name)}</p>
                    <p className="text-white/70 mt-0.5">${Number(payload[0].value).toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 16px rgba(26,77,58,0.08)' }}>
            <h3 className="text-base font-bold mb-1 flex items-center gap-2" style={{ color: '#1a4d3a' }}>
                <span className="w-2 h-6 rounded-full inline-block" style={{ backgroundColor: '#7d4e31' }}></span>
                {t('dashboard.expensesByCategory')}
            </h3>
            <p className="text-xs mb-4" style={{ color: '#a06040' }}>{t('dashboard.sixMonthsCashflow')}</p>

            <div className="flex items-center justify-center relative min-h-[220px]">
                {data.length === 0 ? (
                    <p className="text-sm" style={{ color: '#7d4e31' }}>{t('dashboard.noTransactions')}</p>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={95}
                                    paddingAngle={4} dataKey="total" nameKey="name" stroke="none" cornerRadius={6}>
                                    {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#7d4e31' }}>Jami</span>
                            <span className="text-2xl font-bold mt-0.5" style={{ color: '#1a4d3a' }}>
                                ${data.reduce((s, i) => s + i.total, 0).toLocaleString()}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
                {data.slice(0, 4).map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></div>
                        <span className="truncate" style={{ color: '#7d4e31' }}>{t(`categories.${cat.name}`, cat.name)}</span>
                        <span className="font-semibold ml-auto" style={{ color: '#1a4d3a' }}>${Number(cat.total).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
