import { NextResponse } from 'next/server';
import { destroyAdminSession } from '@/app/admin/auth/session';

export async function POST() {
    try {
        await destroyAdminSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}
