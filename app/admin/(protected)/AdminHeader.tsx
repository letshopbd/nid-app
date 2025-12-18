'use client';

import { useState, useEffect } from 'react';
import MobileNav from '@/app/components/MobileNav';

interface AdminHeaderProps {
    email: string;
}

export default function AdminHeader({ email }: AdminHeaderProps) {
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
        const interval = setInterval(fetchCounts, 10000); // 10s poll for mobile/header
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none sticky top-0 md:static z-20 shadow-sm md:shadow-none">
            <div className="flex items-center gap-3">
                <MobileNav type="admin" userCounts={counts} />
                <div className="md:hidden">
                    <h1 className="text-lg font-bold text-slate-800">Admin</h1>
                </div>
                <div className="hidden md:block">
                    <h1 className="text-2xl font-bold text-slate-800">Admin Overview</h1>
                    <p className="text-slate-500 text-sm">Manage website content and services</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg overflow-hidden border border-blue-200">
                        <img
                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${email}`}
                            alt="Admin Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="text-sm hidden md:block">
                        <p className="font-bold text-slate-700">Administrator</p>
                        <p className="text-xs text-slate-400">{email}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
