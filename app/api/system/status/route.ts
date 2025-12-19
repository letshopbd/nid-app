import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['server_status', 'maintenance_trigger_time', 'maintenance_pending_status'] }
            }
        });

        const getValue = (key: string) => settings.find(s => s.key === key)?.value;

        const serverStatus = getValue('server_status') || 'ON';
        const maintenanceTrigger = getValue('maintenance_trigger_time');
        const pendingStatus = getValue('maintenance_pending_status');

        let activeStatus = serverStatus;
        let targetTime = null;

        if (maintenanceTrigger) {
            const triggerTime = new Date(maintenanceTrigger).getTime();
            const now = new Date().getTime();

            if (now >= triggerTime) {
                // Time passed, effectively switch status
                activeStatus = pendingStatus || 'DOWN';
            } else {
                // Time is in future
                targetTime = maintenanceTrigger;
            }
        }

        return NextResponse.json({
            status: activeStatus,
            maintenanceTarget: targetTime
        });
    } catch (error) {
        console.error('Failed to fetch system status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
