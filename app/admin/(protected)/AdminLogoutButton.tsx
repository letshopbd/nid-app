'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function AdminLogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
            });
            router.push('/admin/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-3 px-3 py-2.5 text-red-500 rounded-lg hover:bg-red-50 w-full transition font-medium disabled:opacity-50"
        >
            <LogOut className="w-4 h-4" /> {loading ? 'Signing Out...' : 'Sign Out'}
        </button>
    );
}
