import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function CategoryPieChart({ data }) {
    const { t } = useTranslation();
    const colors = data.map(d => d.color || '#6366f1');

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-sm">
                    <p className="font-medium text-slate-900 flex items-center gap-2">
                        <span style={{ color: payload[0].payload.color }}>●</span>
                        {payload[0].name}
                    </p>
                    <p className="text-slate-600 mt-1">${Number(payload[0].value).toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-6 bg-purple-500 rounded-full inline-block"></span>
                {t('dashboard.expensesByCategory')}
            </h3>
            <p className="text-sm text-slate-500 mb-4">{t('dashboard.sixMonthsCashflow')}</p>

            <div className="flex-1 flex items-center justify-center relative min-h-[250px]">
                {data.length === 0 ? (
                    <div className="text-slate-400">{t('dashboard.noTransactions')}</div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="total"
                                    nameKey="name"
                                    stroke="none"
                                    cornerRadius={6}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total</span>
                            <span className="text-2xl font-bold text-slate-900 mt-1">
                                ${data.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-6">
                {data.slice(0, 4).map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-slate-600 truncate">{cat.name}</span>
                        <span className="text-slate-900 font-medium ml-auto">${Number(cat.total).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
