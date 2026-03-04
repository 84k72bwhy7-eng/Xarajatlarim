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

    // CRUD States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', icon: '💰', type: 'EXPENSE', color: '#1a4d3a' });

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [accountForm, setAccountForm] = useState({ name: '', type: 'CASH', balance: 0, color: '#1a4d3a', icon: 'wallet' });

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
            // Update global state or trigger refresh if needed
            window.location.reload(); // Refresh to update navbar avatar
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
            reader.onloadend = async () => {
                const base64 = reader.result;
                setProfileForm(prev => ({ ...prev, avatar: base64 }));
                // Optionally auto-save avatar
                try {
                    await updateProfile({ ...profileForm, avatar: base64 });
                    alert('Rasm saqlandi!');
                    window.location.reload();
                } catch (err) {
                    alert('Rasmni saqlashda xato');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Category CRUD
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, categoryForm);
            } else {
                await createCategory(categoryForm);
            }
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
            setCategoryForm({ name: '', icon: '💰', type: 'EXPENSE', color: '#1a4d3a' });
            loadData();
        } catch (err) {
            alert('Kategoriyani saqlashda xato');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Ushbu kategoriyani o\'chirmoqchimisiz?')) return;
        try {
            await deleteCategory(id);
            loadData();
        } catch (err) {
            alert('O\'chirishda xato');
        }
    };

    const openEditCategory = (cat) => {
        setEditingCategory(cat);
        setCategoryForm({ name: cat.name, icon: cat.icon, type: cat.type, color: cat.color });
        setIsCategoryModalOpen(true);
    };

    // Account CRUD
    const handleAccountSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAccount) {
                await updateAccount(editingAccount.id, accountForm);
            } else {
                await createAccount(accountForm);
            }
            setIsAccountModalOpen(false);
            setEditingAccount(null);
            setAccountForm({ name: '', type: 'CASH', balance: 0, color: '#1a4d3a', icon: 'wallet' });
            loadData();
        } catch (err) {
            alert('Hisobni saqlashda xato');
        }
    };

    const handleDeleteAccount = async (id) => {
        if (!confirm('Ushbu hisobni o\'chirmoqchimisiz?')) return;
        try {
            await deleteAccount(id);
            loadData();
        } catch (err) {
            alert('O\'chirishda xato');
        }
    };

    const openEditAccount = (acc) => {
        setEditingAccount(acc);
        setAccountForm({ name: acc.name, type: acc.type, balance: acc.balance, color: acc.color, icon: acc.icon });
        setIsAccountModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-forest-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
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
                                required
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
                                required
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
                        <button
                            onClick={() => {
                                setEditingCategory(null);
                                setCategoryForm({ name: '', icon: '💰', type: 'EXPENSE', color: '#1a4d3a' });
                                setIsCategoryModalOpen(true);
                            }}
                            className="p-2 bg-earth-600 text-white rounded-xl shadow-lg hover:bg-earth-700 transition-all hover:scale-110 active:scale-95"
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>
                    {categories.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-forest-200">
                            <Tag className="mx-auto text-forest-200 mb-2" size={40} />
                            <p className="text-slate-400 text-sm">Hozircha hech qanday kategoriya yo'q</p>
                        </div>
                    ) : (
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
                                        <button onClick={() => openEditCategory(cat)} className="p-2 text-slate-400 hover:text-earth-600 transition">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-slate-400 hover:text-red-500 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Accounts Management */}
            {activeTab === 'accounts' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-forest-900">Mening hisoblarim</h2>
                        <button
                            onClick={() => {
                                setEditingAccount(null);
                                setAccountForm({ name: '', type: 'CASH', balance: 0, color: '#1a4d3a', icon: 'wallet' });
                                setIsAccountModalOpen(true);
                            }}
                            className="p-2 bg-earth-600 text-white rounded-xl shadow-lg hover:bg-earth-700 transition-all hover:scale-110 active:scale-95"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    {accounts.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-forest-200">
                            <Wallet className="mx-auto text-forest-200 mb-2" size={40} />
                            <p className="text-slate-400 text-sm">Hozircha hech qanday hisob yo'q</p>
                        </div>
                    ) : (
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
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditAccount(acc)} className="p-2 text-slate-400 hover:text-earth-600">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 text-slate-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-forest-900 mb-4">
                            {editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
                        </h3>
                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">Nomi</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.name}
                                    onChange={e => setCategoryForm(c => ({ ...c, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-forest-800 mb-1">Ikonka</label>
                                    <input
                                        type="text"
                                        required
                                        value={categoryForm.icon}
                                        onChange={e => setCategoryForm(c => ({ ...c, icon: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl text-center text-xl outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-forest-800 mb-1">Rang</label>
                                    <input
                                        type="color"
                                        value={categoryForm.color}
                                        onChange={e => setCategoryForm(c => ({ ...c, color: e.target.value }))}
                                        className="w-full h-[46px] p-1 bg-forest-50 border border-forest-100 rounded-xl outline-none cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">Turi</label>
                                <div className="flex gap-2">
                                    {['EXPENSE', 'INCOME'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setCategoryForm(c => ({ ...c, type }))}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 border-2 ${categoryForm.type === type
                                                ? type === 'EXPENSE'
                                                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-100'
                                                    : 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {type === 'EXPENSE' ? 'Chiqim' : 'Kirim'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[1.5] py-3 px-6 bg-forest-700 text-white rounded-xl font-bold shadow-lg shadow-forest-100 hover:bg-forest-800 transition-all active:scale-95"
                                >
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Account Modal */}
            {isAccountModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-forest-900 mb-4">
                            {editingAccount ? 'Hisobni tahrirlash' : 'Yangi hisob'}
                        </h3>
                        <form onSubmit={handleAccountSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">Nomi</label>
                                <input
                                    type="text"
                                    required
                                    value={accountForm.name}
                                    onChange={e => setAccountForm(a => ({ ...a, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-forest-800 mb-1">Balans</label>
                                <input
                                    type="number"
                                    required
                                    value={accountForm.balance}
                                    onChange={e => setAccountForm(a => ({ ...a, balance: Number(e.target.value) }))}
                                    className="w-full px-4 py-2.5 bg-forest-50 border border-forest-100 rounded-xl outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAccountModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[1.5] py-3 px-6 bg-forest-700 text-white rounded-xl font-bold shadow-lg shadow-forest-100 hover:bg-forest-800 transition-all active:scale-95"
                                >
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
