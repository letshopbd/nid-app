import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch User's Request Stats
        // 1. Total Orders (All Requests)
        const totalOrders = await prisma.request.count({
            where: { userId }
        });

        // 2. Pending Orders
        const pendingOrders = await prisma.request.count({
            where: {
                userId,
                status: { in: ['PENDING', 'PROCESSING'] }
            }
        });

        // 3. Cancelled Orders
        const cancelledOrders = await prisma.request.count({
            where: { userId, status: 'CANCELLED' }
        });

        // 4. Total Revenue (Total Spent by User) - Exclude Cancelled
        const requests = await prisma.request.findMany({
            where: {
                userId,
                status: { not: 'CANCELLED' }
            },
            select: { fee: true }
        });
        const totalRevenue = requests.reduce((sum, req) => sum + (req.fee || 0), 0);

        return NextResponse.json({
            totalOrders,
            pendingOrders,
            cancelledOrders,
            totalRevenue
        });

    } catch (error) {
        console.error('Failed to fetch user stats', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
