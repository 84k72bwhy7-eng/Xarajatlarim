import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    User, Mail, Camera, Save, Key, Plus, Trash2,
    Edit2, Wallet, Tag, ChevronRight, Loader2, Leaf
} from 'lucide-react';
import {
    getProfile, updateProfile, updatePassword,
    getCategories, createCategory, updateCategory, deleteCategory,
    getAccounts, createAccount, updateAccount, deleteAccount
} from '../lib/api';
import { getCategoryName } from '../lib/categoryTranslations';

export default function ProfilePage() {
    const { t, i18n } = useTranslation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // info, categories, accounts, security

    // Forms
    const [profileForm, setProfileForm] = useState({ name: '', email: '', avatar: '' });
    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    // Lists
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pRes, cRes, aRes] = await Promise.all([
                getProfile(),
                getCategories(),
                getAccounts()
            ]);
            setUser(pRes.data);
            setProfileForm({ name: pRes.data.name, email: pRes.data.email, avatar: pRes.data.avatar || '' });
            setCategories(cRes.data);
            setAccounts(aRes.data);
        } catch (err) {
            console.error('Error loading profile data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profileForm);
            alert('Profil yangilandi!');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirmPassword) {
            alert('Parollar mos kelmadi');
            return;
        }
        try {
            await updatePassword({
                currentPassword: passForm.currentPassword,
                newPassword: passForm.newPassword
            });
            alert('Parol yangilandi!');
            setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-forest-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / User Summary */}
            <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1a4d3a 0%, #2d7a55 100%)' }}>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden bg-forest-800 flex items-center justify-center font-bold text-3xl">
                            {profileForm.avatar ? (
                                <img src={profileForm.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <span>{user?.name?.charAt(0)}</span>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-earth-600 flex items-center justify-center cursor-pointer shadow-lg hover:bg-earth-700 transition">
                            <Camera size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-bold">{user?.name}</h1>
                        <p className="text-white/70">{user?.email}</p>
                        <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/10">
                                {user?.role === 'SUPERADMIN' ? '👑 SuperAdmin' : t('auth.user')}
                            </span>
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/10 capitalize">
                                {user?.currency}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-1 gap-2 border-b border-forest-100">
                {[
                    { id: 'info', label: 'Ma\'lumotlar', icon: User },
                    { id: 'categories', label: 'Kategoriyalar', icon: Tag },
                    { id: 'accounts', label: 'Hisoblar', icon: Wallet },
                    { id: 'security', label: 'Xavfsizlik', icon: Key },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all shrink-0 border-b-2 ${activeTab === tab.id
                                ? 'text-forest-700 border-forest-600'
                                : 'text-slate-400 border-transparent'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Info Form */}
            {activeTab === 'info' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50 max-w-lg">
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-forest-800 flex items-center gap-2">
                                <User size={14} /> {t('auth.name')}
                            </label>
                            <input
                                type="text"
                                value={profileForm.name}
                                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl focus:ring-2 focus:ring-forest-500 outline-none text-forest-900"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-forest-800 flex items-center gap-2">
                                <Mail size={14} /> {t('auth.email')}
                            </label>
                            <input
                                type="email"
                                value={profileForm.email}
                                onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl focus:ring-2 focus:ring-forest-500 outline-none text-forest-900"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-forest-600 hover:bg-forest-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 w-full transition shadow-lg shadow-forest-200"
                        >
                            <Save size={18} /> Saqlash
                        </button>
                    </form>
                </div>
            )}

            {/* Categories Management */}
            {activeTab === 'categories' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-forest-900">Mening kategoriyalarim</h2>
                        {/* Add button would go here */}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categories.map(cat => (
                            <div key={cat.id} className="bg-white p-4 rounded-xl shadow-sm border border-forest-50 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                                    >
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <p className="font-bold text-forest-900">{getCategoryName(cat.name, i18n.language)}</p>
                                        <p className="text-xs text-slate-400 capitalize">{cat.type === 'EXPENSE' ? 'Chiqim' : 'Kirim'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-slate-400 hover:text-earth-600 transition">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-red-500 transition focus-visible:opacity-100">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Accounts Management */}
            {activeTab === 'accounts' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-forest-900">Mening hisoblarim</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-white p-4 rounded-xl shadow-sm border border-forest-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-600">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-forest-900">{acc.name}</p>
                                        <p className="text-xs text-forest-600 font-bold">${Number(acc.balance).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-earth-600">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50 max-w-lg">
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-forest-800">Joriy parol</label>
                            <input
                                type="password"
                                required
                                value={passForm.currentPassword}
                                onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-forest-800">Yangi parol</label>
                            <input
                                type="password"
                                required
                                value={passForm.newPassword}
                                onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-forest-800">Yangi parolni tasdiqlang</label>
                            <input
                                type="password"
                                required
                                value={passForm.confirmPassword}
                                onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-forest-600 hover:bg-forest-700 text-white font-bold py-3 px-6 rounded-xl w-full transition shadow-lg shadow-forest-200"
                        >
                            Parolni o'zgartirish
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
