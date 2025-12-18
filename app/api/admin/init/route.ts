import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const adminExists = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (adminExists) {
            return NextResponse.json({ message: 'Admin already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash('123456', 10);

        const admin = await prisma.user.create({
            data: {
                username: 'admin',
                email: 'admin@nidapp.com',
                password: hashedPassword,
                role: 'ADMIN',
                name: 'Super Admin',
                balance: 0,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json({ message: 'Admin created successfully', user: admin.username, password: '123456' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
