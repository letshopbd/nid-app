import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const pendingOrders = await prisma.request.count({
            where: {
                status: {
                    in: ['PENDING', 'PROCESSING']
                }
            }
        });

        const pendingRecharges = await prisma.rechargeRequest.count({
            where: {
                status: 'PENDING'
            }
        });

        return NextResponse.json({
            pendingOrders,
            pendingRecharges
        });
    } catch (error) {
        console.error('Failed to sidebar stats', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
