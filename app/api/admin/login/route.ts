import { NextResponse } from 'next/server';
import { createAdminSession } from '@/app/admin/auth/session';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
            return NextResponse.json(
                { error: 'Missing credentials' },
                { status: 400 }
            );
        }

        const session = await createAdminSession(identifier, password);

        if (!session) {
            return NextResponse.json(
                { error: 'Invalid admin credentials' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                username: session.username,
                email: session.email,
            },
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}
