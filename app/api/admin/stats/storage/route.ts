import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get Total Database Size (Postgres specific)
        const dbSizeResult: any[] = await prisma.$queryRaw`
            SELECT pg_size_pretty(pg_database_size(current_database())) as size,
            pg_database_size(current_database()) as raw_size
        `;
        const totalSizeMB = (rawSize / (1024 * 1024)).toFixed(2) + ' MB';
        const rawSize = Number(dbSizeResult[0]?.raw_size || 0);

        // 2. Get specific usage for Files (approximate by summing length of Base64 strings)
        // Note: checking length of text column is efficient enough for this scale
        const fileStorageResult: any[] = await prisma.$queryRaw`
            SELECT sum(length("pdfPath")) as file_size FROM "Request" WHERE "pdfPath" IS NOT NULL
        `;
        const rawFileBytes = Number(fileStorageResult[0]?.file_size || 0);
        const fileUsageMB = (rawFileBytes / (1024 * 1024)).toFixed(2) + ' MB';

        // 3. Row Counts
        const [userCount, requestCount, serviceCount] = await Promise.all([
            prisma.user.count(),
            prisma.request.count(),
            prisma.service.count()
        ]);

        return NextResponse.json({
            totalSize: totalSizeMB,
            rawSize,
            fileUsage: fileUsageMB,
            counts: {
                users: userCount,
                orders: requestCount,
                services: serviceCount
            }
        });

    } catch (error: any) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
