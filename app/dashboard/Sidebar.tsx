'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, ShoppingCart, FileText, CreditCard,
    User, FileClock, Upload, Calculator, LogOut
} from 'lucide-react';

import Image from 'next/image';

export default function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Order Now', icon: ShoppingCart, href: '/dashboard/order' },
        { name: 'Sign Copy NID', icon: FileText, href: '/dashboard/services/sign-copy' },
        { name: 'Birth Registration', icon: FileClock, href: '#' },
        { name: 'Server Copy (Unofficial)', icon: Upload, href: '/dashboard/services/nid' },
        { name: 'Sign to Server Copy', icon: FileText, href: '/dashboard/services/sign-to-server' },
        { name: 'TIN Certificate', icon: Calculator, href: '/dashboard/services/tin-certificate' },
        { name: 'My File List', icon: FileText, href: '/dashboard/my-files' },
        { name: 'Recharge', icon: CreditCard, href: '/dashboard/recharge' },
        { name: 'Profile', icon: User, href: '/dashboard/profile' },
    ];

    return (
        <aside className="w-64 bg-[#e5e7eb] border-r border-slate-300 hidden md:flex flex-col">
            <div className="p-4 border-b border-slate-300 flex items-center justify-center">
                <Image
                    src="/duronto_logo.png"
                    alt="Duronto Seba"
                    width={180}
                    height={50}
                    className="object-contain h-12"
                    priority
                />
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href} // Changed key to href as name is not unique or safe
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-all text-sm font-medium
                                ${isActive
                                    ? 'bg-slate-300 border-l-4 border-slate-800 text-slate-900'
                                    : 'text-slate-700 hover:bg-slate-200 hover:border-l-4 hover:border-slate-500'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-300">
                <Link href="/signout" className="flex items-center gap-3 text-red-600 hover:text-red-700 transition font-medium text-sm">
                    <LogOut className="w-5 h-5" />
                    Log Out
                </Link>
            </div>
        </aside>
    );
}
