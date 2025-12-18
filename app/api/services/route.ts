import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

// GET: Fetch all services
export async function GET() {
    try {
        const services = await prisma.service.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(services);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

// POST: Create a new service (Seed/Admin)
export async function POST(request: Request) {
    try {
        const session = await auth();
        // In a real app, check for Admin role here. 
        // For now, assuming any auth user (or just open for seeding) can create.

        const body = await request.json();
        const { name, icon, link, status } = body;

        const newService = await prisma.service.create({
            data: {
                name,
                icon,
                link,
                status: status || 'Active',
            },
        });

        return NextResponse.json(newService);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}

// PATCH: Update service status
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        // Admin check logic would go here

        const body = await request.json();
        const { id, status } = body;

        const updatedService = await prisma.service.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(updatedService);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
}
