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

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { balance: true }
        });

        return NextResponse.json({ balance: user?.balance ?? 0 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
    }
}
