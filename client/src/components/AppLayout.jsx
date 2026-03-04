import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, PieChart, LogOut, Globe, Leaf, User, Shield, HandCoins, Target } from 'lucide-react';
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
        { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
        { to: '/transactions', icon: ReceiptText, label: t('nav.transactions') },
        { to: '/debts', icon: HandCoins, label: t('nav.debts') },
        { to: '/goals', icon: Target, label: t('nav.goals') },
        { to: '/budgets', icon: PieChart, label: t('nav.budget') },
    ];

    // Add Admin link if superadmin
    if (user?.role === 'SUPERADMIN') {
        navItems.push({ to: '/admin', icon: Shield, label: 'Admin' });
    }

    return (
        <div className="min-h-screen pb-20 sm:pb-0" style={{ backgroundColor: '#f0f5f2' }}>
            {/* Top Navbar */}
            <nav className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: '#1a4d3a', boxShadow: '0 2px 12px rgba(26, 77, 58, 0.4)' }}>
                {/* Logo */}
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                        <Leaf size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">
                        {t('app.title')}
                    </span>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                    {/* Language toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 border border-white/20 transition"
                    >
                        <Globe size={13} />
                        {i18n.language.toUpperCase()}
                    </button>

                    {/* User display */}
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/profile')}>
                        {/* User name */}
                        <span className="text-sm font-medium text-white/70 hidden sm:block group-hover:text-white transition">
                            {user?.name || tgUser?.first_name}
                        </span>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 flex items-center justify-center font-bold text-sm transition group-hover:border-white/60"
                            style={{ backgroundColor: '#2d7a55', color: '#dff2ea' }}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                            ) : tgUser?.photo_url ? (
                                <img src={tgUser.photo_url} alt={tgUser.first_name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{(user?.name || tgUser?.first_name)?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                    </div>

                    {/* Logout (only non-TG) */}
                    {!tgUser && (
                        <button onClick={handleLogout} className="text-white/60 hover:text-red-300 transition ml-1" title="Chiqish">
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </nav>

            {/* Decorative top border stripe */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7d4e31, #2d7a55, #f5e6d0, #2d7a55, #7d4e31)' }} />

            {/* Desktop Navigation */}
            <div className="hidden sm:block border-b border-forest-100 bg-white/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 flex items-center gap-1">
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
                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 ml-auto ${isActive
                                ? 'text-forest-700 border-forest-600'
                                : 'text-slate-400 border-transparent hover:text-forest-600'
                            }`
                        }
                    >
                        <User size={16} />
                        {t('nav.profile')}
                    </NavLink>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto py-6 px-4">
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
                style={{ backgroundColor: '#1a4d3a', boxShadow: '0 -2px 20px rgba(26,77,58,0.5)' }}>
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive
                                    ? 'text-white'
                                    : 'text-white/40 hover:text-white/70'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-white/15' : ''}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                    {/* Add Profile to bottom nav specifically for mobile */}
                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive
                                ? 'text-white'
                                : 'text-white/40 hover:text-white/70'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-white/15' : ''}`}>
                                    <User size={20} />
                                </div>
                                <span className="text-[10px] font-medium">Profil</span>
                            </>
                        )}
                    </NavLink>
                </div>
            </div>
        </div>
    );
}
