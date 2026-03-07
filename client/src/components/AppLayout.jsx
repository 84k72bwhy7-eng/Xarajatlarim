import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, ReceiptText, PieChart, LogOut, Globe, CircleDollarSign, User, Shield, HandCoins, Target, Activity, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logout } from '../lib/api';

export default function AppLayout({ tgUser, user }) {
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
        { to: '/', icon: Home, label: t('nav.dashboard') },
        { to: '/transactions', icon: ReceiptText, label: t('nav.transactions') },
        { to: '/debts', icon: HandCoins, label: t('nav.debts') },
        { to: '/goals', icon: Target, label: t('nav.goals') },
        { to: '/reports', icon: Activity, label: 'Hisobotlar' },
        { to: '/profile', icon: User, label: 'Profil' },
    ];

    // Add Admin link if superadmin
    if (user?.role === 'SUPERADMIN') {
        navItems.push({ to: '/admin', icon: Shield, label: 'Admin' });
    }

    const isTwa = typeof window !== 'undefined' && window.Telegram?.WebApp?.platform && window.Telegram.WebApp.platform !== 'unknown';

    return (
        <div className="min-h-screen pb-20 sm:pb-0" style={{ backgroundColor: '#f0f5f2' }}>

            {/* Desktop Navigation */}
            <div className="hidden sm:block border-b border-forest-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 flex items-center gap-1">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer pr-4 border-r border-forest-100 mr-2" onClick={() => navigate('/')}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a4d3a' }}>
                            <CircleDollarSign size={15} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-forest-800 tracking-tight">{t('app.title')}</span>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${isActive
                                    ? 'text-forest-700 border-forest-600'
                                    : 'text-slate-400 border-transparent hover:text-forest-600'
                                }`
                            }
                        >
                            <item.icon size={16} />
                            {item.label}
                        </NavLink>
                    ))}

                    {/* Right controls */}
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-forest-700 bg-forest-50 border border-forest-100 hover:bg-forest-100 transition"
                        >
                            {i18n.language.toUpperCase()}
                            <ChevronDown size={12} />
                        </button>

                        {/* User display */}
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/profile')}>
                            <span className="text-sm font-medium text-forest-700 hidden sm:block">
                                {user?.name || tgUser?.first_name}
                            </span>
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-forest-200 flex items-center justify-center font-bold text-sm bg-forest-100 text-forest-700">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                                ) : tgUser?.photo_url ? (
                                    <img src={tgUser.photo_url} alt={tgUser.first_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{(user?.name || tgUser?.first_name)?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                        </div>

                        {!tgUser && (
                            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition ml-1" title="Chiqish">
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto py-6 px-4 relative"
                style={{
                    paddingTop: isTwa
                        ? `calc(${(typeof window !== 'undefined' && (window.Telegram?.WebApp?.contentSafeAreaInset?.top || 0)) + (typeof window !== 'undefined' && (window.Telegram?.WebApp?.safeAreaInset?.top || 0))}px + 1.5rem)`
                        : undefined
                }}>
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
                style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 -1px 12px rgba(0,0,0,0.08)',
                    borderTop: '1px solid #e8efe9',
                    paddingBottom: typeof window !== 'undefined' && window.Telegram?.WebApp?.safeAreaInset?.bottom
                        ? `${window.Telegram.WebApp.safeAreaInset.bottom}px`
                        : 'env(safe-area-inset-bottom, 0px)'
                }}>
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all ${isActive
                                    ? 'text-forest-800'
                                    : 'text-slate-400 hover:text-forest-600'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                    <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
}
