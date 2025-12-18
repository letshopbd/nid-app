import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/app/admin/auth/session';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminNotificationSystem from '@/app/components/AdminNotificationSystem';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getAdminSession();

    if (!session) {
        redirect('/admin/login');
    }

    return (
        <div className="h-screen overflow-hidden bg-slate-50 flex">
            <AdminNotificationSystem />
            {/* Sidebar (Desktop) */}
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                {/* Header (Responsive) */}
                <AdminHeader email={session.email} />

                {children}
            </main>
        </div>
    );
}
