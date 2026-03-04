import React, { useState } from 'react';
import { Leaf, LogIn, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { login, register } from '../lib/api';

export default function AuthPage() {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(form.email, form.password);
            } else {
                await register(form.name, form.email, form.password);
            }
            window.location.href = '/';
        } catch (err) {
            setError(err.response?.data?.error || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d2b1e 0%, #1a4d3a 50%, #1e6142 100%)' }}>

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10"
                style={{ background: '#7d4e31', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
                style={{ background: '#f5e6d0', filter: 'blur(80px)', transform: 'translate(-30%, 30%)' }} />

            {/* Leaf decoration */}
            <div className="absolute top-10 right-10 text-white/5 rotate-12">
                <Leaf size={120} />
            </div>
            <div className="absolute bottom-16 left-8 text-white/5 -rotate-12">
                <Leaf size={80} />
            </div>

            {/* Card */}
            <div className="relative w-full max-w-sm z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                        <Leaf size={30} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('app.title')}</h1>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
                    </p>
                </div>

                {/* Form card */}
                <div className="rounded-3xl p-6"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

                    {/* Tab switcher */}
                    <div className="flex rounded-2xl p-1 mb-6"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <button onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLogin ? 'bg-white text-[#1a4d3a]' : 'text-white/60 hover:text-white'}`}>
                            {t('auth.loginBtn')}
                        </button>
                        <button onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-[#1a4d3a]' : 'text-white/60 hover:text-white'}`}>
                            {t('auth.registerBtn')}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-semibold mb-1.5 text-white/70">{t('auth.name')}</label>
                                <input
                                    type="text" name="name" value={form.name} onChange={handleChange} required
                                    placeholder={t('auth.name')}
                                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/30"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 text-white/70">{t('auth.email')}</label>
                            <input
                                type="email" name="email" value={form.email} onChange={handleChange} required
                                placeholder="email@example.com"
                                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/30"
                                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 text-white/70">{t('auth.password')}</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/30"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                                />
                                <button type="button" onClick={() => setShowPass(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl px-4 py-2.5 text-sm text-red-200" style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #f5e6d0, #e8d5b7)', color: '#1a4d3a', boxShadow: '0 4px 16px rgba(245,230,208,0.2)' }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                            {loading ? t('app.loading') : (isLogin ? t('auth.loginBtn') : t('auth.registerBtn'))}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {t('auth.tgLogin')}
                </p>
            </div>
        </div>
    );
}
