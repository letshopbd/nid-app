import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';

import { UTApi } from "uploadthing/server";

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
        const rawSize = Number(dbSizeResult[0]?.raw_size || 0);
        const totalSizeMB = (rawSize / (1024 * 1024)).toFixed(2) + ' MB';

        // 2. Get UploadThing Storage Usage
        let cloudStorageMB = '0.00 MB';
        let hasCloudError = false;

        try {
            const utapi = new UTApi();
            const usage = await utapi.getUsageInfo();
            // Usage returns bytes
            cloudStorageMB = (usage.totalBytes / (1024 * 1024)).toFixed(2) + ' MB';
        } catch (err) {
            console.error('Failed to fetch UT usage:', err);
            hasCloudError = true;
        }

        // 3. Row Counts
        const [userCount, requestCount, serviceCount] = await Promise.all([
            prisma.user.count(),
            prisma.request.count(),
            prisma.service.count()
        ]);

        return NextResponse.json({
            totalSize: totalSizeMB,
            rawSize,
            fileUsage: cloudStorageMB, // Replacing DB file usage with Cloud usage
            isCloud: true,
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
