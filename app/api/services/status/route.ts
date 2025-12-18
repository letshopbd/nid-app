import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';
import crypto from 'crypto';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    try {
        if (name) {
            const service = await prisma.service.findUnique({
                where: { name }
            });
            return NextResponse.json(service || { status: 'Inactive', fee: 0 });
        } else {
            const services = await prisma.service.findMany();
            return NextResponse.json(services);
        }
    } catch (error) {
        console.error('Failed to fetch:', error);
        return NextResponse.json({ error: 'Failed to fetch service status' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id: serviceId, name, status, fee } = body;

        if (!name && !serviceId) {
            return NextResponse.json({ error: 'Service name or ID required' }, { status: 400 });
        }

        let service;

        if (serviceId) {
            service = await prisma.service.update({
                where: { id: serviceId },
                data: {
                    status: status || undefined,
                    fee: fee !== undefined ? Number(fee) : undefined
                }
            });
        } else {
            service = await prisma.service.upsert({
                where: { name: name },
                update: {
                    status: status || 'Active',
                    fee: fee !== undefined ? Number(fee) : 0
                },
                create: {
                    name,
                    status: status || 'Active',
                    fee: fee !== undefined ? Number(fee) : 0,
                    link: '#'
                }
            });
        }
        return NextResponse.json(service);

    } catch (error) {
        console.error('Service update failed', error);
        return NextResponse.json({ error: `Failed to update service: ${(error as Error).message}` }, { status: 500 });
    }
}
