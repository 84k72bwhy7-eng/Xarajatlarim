import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, PieChart, LogOut, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logout } from '../lib/api';

export default function AppLayout({ tgUser }) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'uz' ? 'ru' : 'uz';
        i18n.changeLanguage(newLang);
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
        { to: '/transactions', icon: ReceiptText, label: t('nav.transactions') },
        { to: '/budgets', icon: PieChart, label: t('nav.budget') },
    ];

    return (
        <div className="min-h-screen pb-20 sm:pb-0" style={{ backgroundColor: 'var(--tg-theme-bg-color, #f8fafc)' }}>
            {/* Navbar (Top) */}
            <nav className="border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30"
                style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)', borderColor: 'var(--tg-theme-hint-color, #e2e8f0)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        PF
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'var(--tg-theme-text-color, #0f172a)' }}>
                        {t('app.title')}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleLanguage} className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200" title={t('settings.language')}>
                        <Globe size={16} />
                        {i18n.language.toUpperCase()}
                    </button>
                    {tgUser && (
                        <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--tg-theme-hint-color, #64748b)' }}>
                            {tgUser.first_name}
                        </span>
                    )}
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-medium overflow-hidden border border-slate-200 cursor-pointer">
                        {tgUser?.photo_url ? (
                            <img src={tgUser.photo_url} alt={tgUser.first_name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-slate-500 text-sm">{tgUser?.first_name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    {!tgUser && (
                        <button onClick={handleLogout} className="text-slate-500 hover:text-rose-500">
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="max-w-4xl mx-auto py-6 px-4">
                <Outlet />
            </main>

            {/* Bottom Navigation for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-white sm:hidden z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
                style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)', borderColor: 'var(--tg-theme-hint-color, #e2e8f0)' }}>
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                }`
                            }
                            style={({ isActive }) => ({ color: isActive ? 'var(--tg-theme-button-color, #4f46e5)' : 'var(--tg-theme-hint-color, #94a3b8)' })}
                        >
                            <item.icon size={22} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

        </div>
    );
}
