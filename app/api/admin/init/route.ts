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
            await seedServices();
            return NextResponse.json({ message: 'Admin already exists. Services re-seeded.' }, { status: 200 });
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

        await seedServices();

        return NextResponse.json({
            message: 'Admin created & Services seeded successfully',
            user: admin.username,
            password: '123456'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function seedServices() {
    const services = [
        { name: 'NID Server Copy', icon: 'FileText', fee: 100, status: 'Active', link: '/dashboard/services/server-copy' },
        { name: 'NID Sign Copy', icon: 'PenTool', fee: 150, status: 'Active', link: '/dashboard/services/sign-copy' },
        { name: 'Server Copy (Unofficial)', icon: 'File', fee: 50, status: 'Active', link: '/dashboard/services/nid' },
        { name: 'TIN Certificate', icon: 'FileCheck', fee: 80, status: 'Active', link: '/dashboard/services/tin-certificate' }
    ];

    for (const service of services) {
        const exists = await prisma.service.findUnique({
            where: { name: service.name }
        });

        if (!exists) {
            await prisma.service.create({
                data: service
            });
        }
    }
}
