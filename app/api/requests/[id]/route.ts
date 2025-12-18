import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

export async function GET(
    req: NextRequest
) {
    // Extract ID from URL manually since params argument type is tricky in Next.js 15+ sometimes or just easier this way
    const id = req.nextUrl.pathname.split('/').pop();

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        const request = await prisma.request.findUnique({
            where: { id },
        });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json(request);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest
) {
    const id = req.nextUrl.pathname.split('/').pop();

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const status = formData.get('status') as string;
        const file = formData.get('file') as File;

        const data: any = {};
        if (status) data.status = status;

        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${id}-${file.name}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            await fs.promises.writeFile(filePath, buffer);

            data.pdfPath = `/uploads/${fileName}`;
            data.status = 'COMPLETED'; // Auto complete on upload
        }

        const request = await prisma.request.update({
            where: { id },
            data,
        });

        return NextResponse.json(request);
    } catch (error) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
