import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import prisma from '@/app/lib/prisma';

const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

export interface AdminSession {
    userId: string;
    username: string;
    email: string;
}

/**
 * Verify admin credentials and create session
 */
export async function createAdminSession(identifier: string, password: string): Promise<AdminSession | null> {
    try {
        // Find admin user by username or email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            },
        });

        if (!user || user.role !== 'ADMIN') {
            return null;
        }

        // Verify password
        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) {
            return null;
        }

        // Create session data
        const sessionData: AdminSession = {
            userId: user.id,
            username: user.username || user.email,
            email: user.email,
        };

        // Store in cookie
        const cookieStore = await cookies();
        cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_DURATION,
            path: '/',
        });

        return sessionData;
    } catch (error) {
        console.error('Admin session creation error:', error);
        return null;
    }
}

/**
 * Get current admin session
 */
export async function getAdminSession(): Promise<AdminSession | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

        if (!sessionCookie?.value) {
            return null;
        }

        const sessionData = JSON.parse(sessionCookie.value) as AdminSession;

        // Verify user still exists and is admin
        const user = await prisma.user.findUnique({
            where: {
                id: sessionData.userId,
            },
        });

        if (!user || user.role !== 'ADMIN') {
            await destroyAdminSession();
            return null;
        }

        return sessionData;
    } catch (error) {
        console.error('Admin session retrieval error:', error);
        return null;
    }
}

/**
 * Destroy admin session
 */
export async function destroyAdminSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_SESSION_COOKIE);
}
