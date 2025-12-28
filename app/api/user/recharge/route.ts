import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch user's recharge history
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        const recharges = await prisma.rechargeRequest.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json(recharges);
    } catch (error) {
        console.error('Failed to fetch recharge history', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

// POST: Create a new recharge request
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { amount, transactionId, paymentNumber } = body;

        if (!amount || !transactionId) {
            return NextResponse.json({ error: 'Amount and Transaction ID are required' }, { status: 400 });
        }

        // Verify user exists to avoid foreign key constraint errors (if user was deleted but session persists)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found. Please log out and log in again.' }, { status: 401 });
        }

        const orderId = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const newRequest = await prisma.rechargeRequest.create({
            data: {
                userId: session.user.id,
                orderId,
                amount: parseFloat(amount),
                transactionId,
                paymentNumber,
                status: 'PENDING'
            }
        });

        return NextResponse.json(newRequest);
    } catch (error) {
        console.error('Failed to create recharge request', error);
        return NextResponse.json({ error: `Failed to create request: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}
