import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users, BarChart3, Trash2, Shield,
    TrendingUp, Activity, Loader2, Leaf, MoreVertical,
    UserCircle, Mail, Calendar, CreditCard
} from 'lucide-react';
import { getAdminUsers, getAdminStats, updateAdminUserRole, deleteAdminUser } from '../lib/api';
import { formatCurrency } from '../lib/format';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-forest-50 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`} style={{ backgroundColor: color }}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-black text-forest-900">{value}</h4>
        </div>
    </div>
);

export default function AdminPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [uRes, sRes] = await Promise.all([
                getAdminUsers(),
                getAdminStats()
            ]);
            setUsers(uRes.data);
            setStats(sRes.data);
        } catch (err) {
            console.error('Error loading admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'SUPERADMIN' ? 'USER' : 'SUPERADMIN';
        if (!window.confirm(`Foydalanuvchi rolini ${newRole} ga o'zgartirmoqchimisiz?`)) return;

        try {
            await updateAdminUserRole(userId, newRole);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Foydalanuvchini o\'chirib tashlamoqchimisiz? Barcha ma\'lumotlar o\'chib ketadi!')) return;

        try {
            await deleteAdminUser(userId);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik yuz berdi');
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-forest-900 flex items-center gap-3">
                    <Shield className="text-forest-600" size={28} />
                    SuperAdmin Paneli
                </h1>
                <p className="text-slate-500 text-sm mt-1">Platforma boshqaruvi va statistikasi</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Foydalanuvchilar" value={stats?.users || 0} icon={Users} color="#1a4d3a" />
                <StatCard title="Tranzaksiyalar" value={stats?.transactions || 0} icon={Activity} color="#2d7a55" />
                <StatCard title="Umumiy aylanma" value={formatCurrency(stats?.totalVolume)} icon={BarChart3} color="#7d4e31" />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-forest-50 overflow-hidden">
                <div className="p-5 border-b border-forest-50 flex items-center justify-between">
                    <h3 className="font-bold text-forest-900 flex items-center gap-2">
                        <Users size={18} />
                        Foydalanuvchilar ro'yxati
                    </h3>
                    <span className="bg-forest-50 text-forest-600 px-3 py-1 rounded-full text-xs font-bold">
                        Jami: {users.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Foydalanuvchi</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Faollik</th>
                                <th className="px-6 py-4">Harakatlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-600 font-bold overflow-hidden shadow-sm">
                                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-forest-900">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${u.role === 'SUPERADMIN' ? 'bg-forest-100 text-forest-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                            <span className="flex items-center gap-1"><Activity size={10} /> {u._count?.transactions} tx</span>
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(u.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRoleChange(u.id, u.role)}
                                                className="p-1.5 rounded-lg text-forest-600 hover:bg-forest-50 transition"
                                                title="Rolni o'zgartirish"
                                            >
                                                <Shield size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition"
                                                title="O'chirish"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
