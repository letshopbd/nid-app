'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Menu, X, LayoutDashboard, ShoppingCart, FileText,
    CreditCard, User, FileClock, Upload, Calculator,
    LogOut, ShieldCheck, Server, Users, Settings, Smartphone
} from 'lucide-react';

import Image from 'next/image';

interface MobileNavProps {
    type: 'user' | 'admin';
    userCounts?: {
        pendingOrders: number;
        pendingRecharges: number;
    };
    user?: {
        name?: string | null;
        email?: string | null;
    };
}

export default function MobileNav({ type, userCounts = { pendingOrders: 0, pendingRecharges: 0 }, user }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const isActive = (path: string) => pathname === path;

    const userMenuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Order Now', icon: ShoppingCart, href: '/dashboard/order' },
        { name: 'Sign Copy NID', icon: FileText, href: '/dashboard/services/sign-copy' },
        { name: 'Birth Registration', icon: FileClock, href: '/dashboard/services/birth-registration' },
        { name: 'Server Copy (Unofficial)', icon: Upload, href: '/dashboard/services/nid' },
        { name: 'Sign to Server Copy', icon: FileText, href: '/dashboard/services/sign-to-server' },
        { name: 'TIN Certificate', icon: Calculator, href: '/dashboard/services/tin-certificate' },
        { name: 'My File List', icon: FileText, href: '/dashboard/my-files' },
        { name: 'Recharge', icon: CreditCard, href: '/dashboard/recharge' },
        { name: 'Profile', icon: User, href: '/dashboard/profile' },
    ];

    const adminMenuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { name: 'Service Control', icon: Server, href: '/admin/service-fee' },
        { name: 'Orders', icon: FileText, href: '/admin/orders', count: userCounts.pendingOrders },
        { name: 'Users', icon: Users, href: '/admin/users' },
        { name: 'Recharge Requests', icon: CreditCard, href: '/admin/recharge', count: userCounts.pendingRecharges },
        { name: 'Settings', icon: Settings, href: '/admin/settings' },
    ];

    const items = type === 'user' ? userMenuItems : adminMenuItems;

    const Drawer = (
        <div className={`fixed inset-0 z-[100] flex ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Content */}
            <div
                className={`relative bg-white w-[280px] h-full shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        {type === 'user' ? (
                            <Image
                                src="/duronto_logo.png"
                                alt="Duronto Seba"
                                width={150}
                                height={40}
                                className="object-contain h-10 w-auto"
                            />
                        ) : (
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                                <ShieldCheck className="w-6 h-6" />
                                Admin
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info / Banner (Optional) */}
                <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
                            <Smartphone className="w-5 h-5 text-white/80" />
                        </div>
                        <div>
                            <p className="text-xs text-white/60 font-medium">Welcome,</p>
                            <p className="text-sm font-bold truncate max-w-[180px]">
                                {type === 'user' ? (user?.name || 'User') : 'Administrator'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {items.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-[15px] group
                                    ${active
                                        ? 'bg-slate-100 text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                                    }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
                                    {item.name}
                                </div>
                                {type === 'admin' && (item as any).count > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        {(item as any).count}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    {type === 'user' ? (
                        <Link href="/signout" className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition font-bold text-sm w-full">
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </Link>
                    ) : (
                        <Link href="/admin/logout" className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition font-bold text-sm w-full">
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="md:hidden">
            <button
                onClick={() => setIsOpen(true)}
                className="p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all active:scale-95"
                title="Open Menu"
            >
                <Menu className="w-6 h-6" />
            </button>
            {mounted && createPortal(Drawer, document.body)}
        </div>
    );
}
