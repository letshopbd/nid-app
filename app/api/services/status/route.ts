import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';
import crypto from 'crypto';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    try {
        if (name) {
            // Raw SQL to ensure we get 'fee' even if Prisma Client is stale
            const services = await prisma.$queryRaw`SELECT * FROM Service WHERE name = ${name} LIMIT 1`;
            const service = Array.isArray(services) && services.length > 0 ? services[0] : null;

            return NextResponse.json(service || { status: 'Inactive', fee: 0 });
        } else {
            const services = await prisma.$queryRaw`SELECT * FROM Service`;
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
            // Update by ID
            // We use ExecuteRawUnsafe to bypass Prisma Client validation for 'fee' if generic client is stale
            await prisma.$executeRawUnsafe(
                `UPDATE Service SET status = ?, fee = ? WHERE id = ?`,
                status || 'Active',
                fee !== undefined ? Number(fee) : 0,
                serviceId
            );

            // Fetch the updated record to return it
            service = await prisma.service.findUnique({ where: { id: serviceId } });
        } else {
            // Upsert by Name logic using Raw SQL to ensure fee is saved
            // First try update
            const result = await prisma.$executeRawUnsafe(
                `UPDATE Service SET status = ?, fee = ? WHERE name = ?`,
                status || 'Active',
                fee !== undefined ? Number(fee) : 0,
                name
            );

            // If no rows updated, Insert
            // We need to check if result (number of changes) is 0. 
            // result is usually number of rows.
            // But types might vary. Safe assumption: if findUnique returns null, then insert.

            service = await prisma.service.findUnique({ where: { name } });

            if (service) {
                // It was updated (or existed)
            } else {
                // Insert
                const newId = crypto.randomUUID();
                await prisma.$executeRawUnsafe(
                    `INSERT INTO Service (id, name, status, fee, link, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
                    newId,
                    name,
                    status || 'Active',
                    fee !== undefined ? Number(fee) : 0,
                    '#',
                    new Date()
                );
                service = await prisma.service.findUnique({ where: { id: newId } });
            }
        }
        return NextResponse.json(service);

    } catch (error) {
        console.error('Service update failed', error);
        return NextResponse.json({ error: `Failed to update service: ${(error as Error).message}` }, { status: 500 });
    }
}
