'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import MobileNav from '../components/MobileNav';

import Link from 'next/link';

interface UserData {
    name?: string | null;
    email?: string | null;
    username?: string | null;
    avatarSalt?: number | null;
}

interface DashboardHeaderProps {
    initialBalance: number;
    user: UserData;
    serverStatus: string;
    maintenanceTarget?: string | null;
}

export default function DashboardHeader({
    initialBalance,
    user,
    serverStatus,
    maintenanceTarget
}: DashboardHeaderProps) {
    const [balance, setBalance] = useState(initialBalance);
    const [activeStatus, setActiveStatus] = useState(serverStatus);
    const [activeTarget, setActiveTarget] = useState<string | null | undefined>(maintenanceTarget);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!activeTarget) {
            setTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(activeTarget).getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft('00:00');
                if (typeof window !== 'undefined') window.location.reload();
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeTarget]);

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

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/system/status');
            if (res.ok) {
                const data = await res.json();
                setActiveStatus(data.status);
                setActiveTarget(data.maintenanceTarget);
            }
        } catch (error) {
            console.error('Failed to update status');
        }
    };

    useEffect(() => {
        // Poll every 5 seconds
        const interval = setInterval(() => {
            fetchBalance();
            fetchStatus();
        }, 5000);

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

    const avatarSeed = (user?.username || user?.email || 'user') + (user?.avatarSalt || 0);
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-all">
            {/* Mobile Menu Trigger */}
            <MobileNav type="user" user={user} />

            {/* Spacer for desktop if needed, or just allow justify-between to push right side */}
            <div className="hidden md:block"></div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Server Status Badge */}
                <div className={`
                    hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all
                    ${activeStatus === 'ON' ? 'bg-green-50 text-green-700 border-green-200' :
                        activeStatus === 'DEV' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'}
                `}>
                    <div className={`w-2 h-2 rounded-full ${activeStatus === 'ON' ? 'bg-green-500' : activeStatus === 'DEV' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                    <span>Server Status: {activeStatus === 'DEV' ? 'DEVELOPMENT' : activeStatus}</span>
                    {timeLeft && (
                        <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-md animate-pulse">
                            {timeLeft}
                        </span>
                    )}
                </div>

                <div className="px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100 flex items-center gap-2 animate-in fade-in duration-500 flex-shrink-0">
                    <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-700 transition-all whitespace-nowrap">
                        ৳ {balance.toFixed(2)}
                    </span>
                </div>

                <Link href="/dashboard/profile" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 flex-shrink-0 group-hover:border-blue-400 transition-colors">
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-sm font-medium text-slate-600 hidden md:block group-hover:text-blue-600 transition-colors">
                        {user?.name || user?.email || 'User'}
                    </span>
                </Link>
            </div>
        </header>
    );
}
