import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';

export const dynamic = 'force-dynamic';

// GET: Fetch all recharge requests
export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const requests = await prisma.rechargeRequest.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } }
            }
        });

        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

// PATCH: Approve or Reject
export async function PATCH(request: Request) {
    try {
        const session = await getAdminSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, status } = body;

        if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const recharge = await tx.rechargeRequest.findUnique({ where: { id } });
            if (!recharge) throw new Error('Request not found');
            if (recharge.status !== 'PENDING') throw new Error('Request already processed');

            // Update status
            const updatedRecharge = await tx.rechargeRequest.update({
                where: { id },
                data: { status }
            });

            // If Approved, add balance
            if (status === 'APPROVED') {
                await tx.user.update({
                    where: { id: recharge.userId },
                    data: { balance: { increment: recharge.amount } }
                });
            }

            return updatedRecharge;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Update failed:', error);
        return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
    }
}
