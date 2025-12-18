import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET: Fetch all orders (requests) with user details
export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orders = await prisma.request.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        username: true,
                    }
                }
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// POST: Update order status and optionally upload PDF
export async function POST(request: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const id = formData.get('id') as string;
        const status = formData.get('status') as string;
        const file = formData.get('file') as File | null;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const removeFile = formData.get('removeFile') === 'true';

        let pdfPath = undefined;
        let finalStatus = status;

        if (removeFile) {
            pdfPath = null; // Explicitly null to remove it in DB
            finalStatus = 'PROCESSING'; // Revert to processing
        } else if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `order-${id}-${Date.now()}.pdf`;

            // Ensure uploads directory exists
            const uploadDir = path.join(process.cwd(), 'public/uploads/files');
            await mkdir(uploadDir, { recursive: true });

            const filePath = path.join(uploadDir, filename);
            await writeFile(filePath, buffer);

            pdfPath = `/uploads/files/${filename}`;
        }

        // Auto-complete if file is attached (and not removing)
        if (pdfPath && !removeFile) {
            finalStatus = 'COMPLETED';
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.request.findUnique({ where: { id } });
            if (!currentOrder) throw new Error('Order not found');

            // Refund Logic: If changing to CANCELLED and wasn't already CANCELLED
            if (finalStatus === 'CANCELLED' && currentOrder.status !== 'CANCELLED' && currentOrder.userId) {
                // Fetch exact fee paid from key-value to ensure accuracy (bypass stale client)
                const requestData: any[] = await tx.$queryRaw`SELECT fee FROM Request WHERE id = ${id}`;
                const feePaid = (requestData && requestData.length > 0) ? Number(requestData[0].fee) : 0;

                // Fallback to 20 ONLY if feePaid is 0 (supports legacy orders before dynamic fee)
                const refundAmount = feePaid > 0 ? feePaid : 20;

                await tx.user.update({
                    where: { id: currentOrder.userId },
                    data: { balance: { increment: refundAmount } }
                });
            }

            return await tx.request.update({
                where: { id },
                data: {
                    status: finalStatus,
                    ...(removeFile ? { pdfPath: null } : (pdfPath ? { pdfPath } : {})),
                },
            });
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Failed to update order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

// PATCH: Update order status (Legacy/Simple)
export async function PATCH(request: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.request.findUnique({ where: { id } });
            if (!currentOrder) throw new Error('Order not found');

            // Refund Logic: If changing to CANCELLED and wasn't already CANCELLED
            if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED' && currentOrder.userId) {
                // Fetch exact fee paid
                const requestData: any[] = await tx.$queryRaw`SELECT fee FROM Request WHERE id = ${id}`;
                const feePaid = (requestData && requestData.length > 0) ? Number(requestData[0].fee) : 0;

                const refundAmount = feePaid > 0 ? feePaid : 20;

                await tx.user.update({
                    where: { id: currentOrder.userId },
                    data: { balance: { increment: refundAmount } }
                });
            }

            return await tx.request.update({
                where: { id },
                data: { status },
            });
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Failed to update order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

// DELETE: Delete order
export async function DELETE(request: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        await prisma.request.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete order:', error);
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
}
