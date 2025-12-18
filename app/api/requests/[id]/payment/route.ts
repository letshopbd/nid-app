import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

// POST: Submit payment details for a request
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params is now a Promise in Next.js 15+
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phone, transactionId } = await request.json();

        if (!phone || !transactionId) {
            return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
        }

        const { id } = await params;

        // Verify request belongs to user (optional but safer)
        const existingRequest = await prisma.request.findUnique({
            where: { id },
        });

        if (!existingRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const updatedRequest = await prisma.request.update({
            where: { id },
            data: {
                phone,
                transactionId,
                status: 'PAID', // Move to PAID status
            },
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Payment submission failed:', error);
        return NextResponse.json({ error: 'Payment submission failed' }, { status: 500 });
    }
}
