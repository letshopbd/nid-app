import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from './Sidebar';
import prisma from '@/app/lib/prisma';
import DashboardHeader from './DashboardHeader';
import SuspendedView from './SuspendedView';
import NoticeBanner from '../components/NoticeBanner';

import UserNotificationSystem from '../components/UserNotificationSystem';
import MaintenanceScreen from '../components/MaintenanceScreen';
import MaintenanceCountdown from '../components/MaintenanceCountdown';

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

    // Check Server Status
    const serverStatusSetting = await prisma.systemSetting.findUnique({
        where: { key: 'server_status' }
    });

    // Check Pending Maintenance
    const maintenanceTrigger = await prisma.systemSetting.findUnique({ where: { key: 'maintenance_trigger_time' } });
    const pendingStatus = await prisma.systemSetting.findUnique({ where: { key: 'maintenance_pending_status' } });

    let activeStatus = serverStatusSetting?.value || 'ON';
    let targetTime = null;
    let nextStatus = null;

    if (maintenanceTrigger?.value) {
        const triggerTime = new Date(maintenanceTrigger.value).getTime();
        const now = new Date().getTime();

        if (now >= triggerTime) {
            // Time passed, effectively switch status
            activeStatus = pendingStatus?.value || 'DOWN';

            // (Optional: We could lazily update the DB here to clean up, 
            // but effectively displaying the maintenance screen is enough for enforcement)
        } else {
            // Time is in future, show countdown
            targetTime = maintenanceTrigger.value;
            nextStatus = pendingStatus?.value || 'DOWN';
        }
    }

    // Start Time (for timer)
    const startTimeSetting = await prisma.systemSetting.findUnique({ where: { key: 'maintenance_start_time' } });
    const startTime = startTimeSetting?.value;

    if (user?.role !== 'ADMIN') {
        // if (activeStatus === 'DOWN') return <MaintenanceScreen mode="DOWN" startTime={startTime} />; // User requested DOWN to be accessible
        if (activeStatus === 'DEV') return <MaintenanceScreen mode="DEV" startTime={startTime} />;
    }

    const balance = user?.balance ?? 0.00;
    const isSuspended = user?.status === 'SUSPENDED';

    return (
        <div className="flex h-screen overflow-hidden bg-[#f3f4f6]">
            <MaintenanceCountdown initialTargetTime={targetTime} initialPendingStatus={nextStatus} />
            <UserNotificationSystem />
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <DashboardHeader
                    initialBalance={balance}
                    user={user || {}}
                    serverStatus={activeStatus}
                    maintenanceTarget={targetTime}
                />

                <NoticeBanner />

                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
