import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';

// GET: Fetch all users
export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: {
                role: {
                    not: 'ADMIN' // Exclude admins
                }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                password: true, // Hashed password
                role: true,
                status: true,
                balance: true,
                createdAt: true,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// PATCH: Suspend/Activate user
export async function PATCH(request: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, action } = body; // action: 'suspend' | 'activate'

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';

        // Prevent suspending the current admin
        if (id === session.userId) {
            return NextResponse.json({ error: 'Cannot suspend yourself' }, { status: 403 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status: newStatus },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Failed to update user status:', error);
        return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }
}

// DELETE: Delete user
export async function DELETE(request: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Prevent deleting the current admin
        if (id === session.userId) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 403 });
        }

        // Delete user and their requests in a transaction
        await prisma.$transaction([
            prisma.request.deleteMany({
                where: { userId: id },
            }),
            prisma.user.delete({
                where: { id },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
