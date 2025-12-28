import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nid, dob } = body;

        if (!nid || !dob) {
            return NextResponse.json({ error: 'Missing NID or Date of Birth' }, { status: 400 });
        }

        const dobDate = new Date(dob);
        if (isNaN(dobDate.getTime())) {
            return NextResponse.json({ error: 'Invalid Date of Birth format' }, { status: 400 });
        }

        const userId = session.user.id;

        // Fetch dynamic fee for "Server Copy Unofficial"
        const service = await prisma.service.findUnique({
            where: { name: 'Server Copy Unofficial' }
        });
        const serviceFee = service?.fee || 20; // Fallback to 20 only if service missing

        // Start transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current user balance (fresh read)
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new Error('User not found');
            }

            if (user.balance < serviceFee) {
                throw new Error('Insufficient balance');
            }

            // 2. Deduct balance
            await tx.user.update({
                where: { id: user.id },
                data: { balance: user.balance - serviceFee },
            });

            // 3. Create request
            const newRequest = await tx.request.create({
                data: {
                    nid,
                    dob: new Date(dob),
                    userId: user.id,
                    fee: serviceFee, // Now enabled since schema has the column
                    status: 'PROCESSING', // Balance deducted
                },
            });

            return newRequest;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Request creation failed:', error);
        if (error.message === 'Insufficient balance') {
            return NextResponse.json({ error: 'Insufficient balance. Please recharge.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const requests = await prisma.request.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        });
        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}
