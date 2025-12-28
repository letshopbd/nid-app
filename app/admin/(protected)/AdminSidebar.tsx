'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    ShieldCheck,
    Users,
    Server,
    CreditCard,
    Settings,
} from 'lucide-react';
import AdminLogoutButton from './AdminLogoutButton';

export default function AdminSidebar() {
    const pathname = usePathname();
    const [counts, setCounts] = useState({
        pendingOrders: 0,
        pendingRecharges: 0
    });

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await fetch(`/api/admin/stats/sidebar?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setCounts(data);
                }
            } catch (error) {
                console.error('Failed to fetch sidebar counts');
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 5000);

        return () => clearInterval(interval);
    }, []);

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="w-64 bg-white border-r border-slate-100 flex-shrink-0 hidden md:flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b border-slate-100 flex-shrink-0">
                <Link href="/admin" className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
                    <ShieldCheck className="w-6 h-6" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Admin Panel
                    </span>
                </Link>
            </div>

            <div className="p-4 space-y-1 flex-1 overflow-y-auto">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-4">Management</div>

                <Link href="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition font-medium ${isActive('/admin') ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>

                <Link href="/admin/service-fee" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition font-medium ${isActive('/admin/service-fee') ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
                    <Server className="w-4 h-4" /> Service Control
                </Link>

                <Link href="/admin/orders" className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition font-medium ${isActive('/admin/orders') ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
                    <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4" /> Orders
                    </div>
                    {counts.pendingOrders > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {counts.pendingOrders}
                        </span>
                    )}
                </Link>

                <Link href="/admin/users" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition font-medium ${isActive('/admin/users') ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
                    <Users className="w-4 h-4" /> Users
                </Link>

                <Link href="/admin/recharge" className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition font-medium ${isActive('/admin/recharge') ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4" /> Recharge Requests
                    </div>
                    {counts.pendingRecharges > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {counts.pendingRecharges}
                        </span>
                    )}
                </Link>

                <Link href="/admin/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition font-medium ${isActive('/admin/settings') ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
                    <Settings className="w-4 h-4" /> Settings
                </Link>
            </div>

            <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <AdminLogoutButton />
            </div>
        </aside>
    );
}
