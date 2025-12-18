'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import MobileNav from '../components/MobileNav';

interface UserData {
    name?: string | null;
    email?: string | null;
}

export default function DashboardHeader({
    initialBalance,
    user
}: {
    initialBalance: number,
    user: UserData
}) {
    const [balance, setBalance] = useState(initialBalance);

    const fetchBalance = async () => {
        try {
            const res = await fetch('/api/user/balance');
            if (res.ok) {
                const data = await res.json();
                setBalance(data.balance);
            }
        } catch (error) {
            console.error('Failed to update balance');
        }
    };

    useEffect(() => {
        // Poll every 5 seconds
        const interval = setInterval(fetchBalance, 5000);

        // Listen for immediate updates
        const handleBalanceUpdate = () => {
            console.log('Immediate balance update triggered');
            fetchBalance();
        };

        window.addEventListener('balanceUpdate', handleBalanceUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('balanceUpdate', handleBalanceUpdate);
        };
    }, []);

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-all">
            {/* Mobile Menu Trigger */}
            <MobileNav type="user" user={user} />

            {/* Spacer for desktop if needed, or just allow justify-between to push right side */}
            <div className="hidden md:block"></div>

            <div className="flex items-center gap-3 md:gap-6">
                <div className="px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100 flex items-center gap-2 animate-in fade-in duration-500 flex-shrink-0">
                    <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-700 transition-all whitespace-nowrap">
                        ৳ {balance.toFixed(2)}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 flex-shrink-0">
                        <img
                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${user?.name || user?.email || 'User'}`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-sm font-medium text-slate-600 hidden md:block">
                        {user?.name || user?.email || 'User'}
                    </span>
                </div>
            </div>
        </header>
    );
}
