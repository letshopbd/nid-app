import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100'); // Default 100 max, optimizable

        const requests = await prisma.request.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: limit, // Optimization: Limit fetched rows
        });

        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}
