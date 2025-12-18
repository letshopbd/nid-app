import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from './Sidebar';
import prisma from '@/app/lib/prisma';
import DashboardHeader from './DashboardHeader';
import SuspendedView from './SuspendedView';
import NoticeBanner from '../components/NoticeBanner';

import UserNotificationSystem from '../components/UserNotificationSystem';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    // Fetch fresh user data including balance and status
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    const balance = user?.balance ?? 0.00;
    const isSuspended = user?.status === 'SUSPENDED';

    return (
        <div className="flex h-screen overflow-hidden bg-[#f3f4f6]">
            <UserNotificationSystem />
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <DashboardHeader initialBalance={balance} user={user || {}} />

                <NoticeBanner />

                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
