import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: { username: null }
        });

        let updatedCount = 0;

        for (const user of users) {
            const timestamp = Date.now().toString().slice(-4);
            const random = Math.floor(100 + Math.random() * 900); // 3 digit random
            // Add a slight delay or salt to ensure uniqueness in loop
            const uniqueSalt = Math.floor(Math.random() * 1000);
            const username = `user_${timestamp}${random}${uniqueSalt}`;

            await prisma.user.update({
                where: { id: user.id },
                data: { username }
            });
            updatedCount++;
        }

        return NextResponse.json({ success: true, updated: updatedCount });
    } catch (error) {
        return NextResponse.json({ error: 'Backfill failed', details: error }, { status: 500 });
    }
}
