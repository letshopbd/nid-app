import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAdminSession } from '@/app/admin/auth/session';

import { UTApi } from "uploadthing/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getAdminSession();
        // if (!session) {
        //    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // 1. Get Total Database Size (Postgres specific)
        let totalSizeMB = '0.00 MB';
        let rawSize = 0;
        try {
            // Only attempt this if we think we are on Postgres, or just try-catch it.
            const dbSizeResult: any[] = await prisma.$queryRaw`
                SELECT pg_size_pretty(pg_database_size(current_database())) as size,
                pg_database_size(current_database()) as raw_size
            `;
            rawSize = Number(dbSizeResult[0]?.raw_size || 0);
            totalSizeMB = (rawSize / (1024 * 1024)).toFixed(2) + ' MB';
        } catch (dbError) {
            console.warn("Failed to get DB size (likely not Postgres):", dbError);
            totalSizeMB = 'N/A';
        }

        // 2. Get UploadThing Storage Usage
        let cloudStorageMB = '0.00 MB';
        let hasCloudError = false;

        try {
            console.log("Checking UT Token:", process.env.UPLOADTHING_TOKEN ? "Present" : "Missing"); // DEBUG
            const utapi = new UTApi();
            const usage = await utapi.getUsageInfo();
            console.log("UT Usage Response:", JSON.stringify(usage)); // DEBUG

            // Usage returns bytes
            cloudStorageMB = (usage.totalBytes / (1024 * 1024)).toFixed(2) + ' MB';

            // 3. Row Counts
            const [userCount, requestCount, serviceCount] = await Promise.all([
                prisma.user.count(),
                prisma.request.count(),
                prisma.service.count()
            ]);

            return NextResponse.json({
                totalSize: totalSizeMB,
                rawSize,

                // Detailed Cloud Stats
                cloud: {
                    usedBytes: usage.totalBytes,
                    limitBytes: usage.limitBytes,
                    fileCount: usage.filesUploaded,
                    usageFormatted: cloudStorageMB,
                    limitFormatted: (usage.limitBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                    percentage: ((usage.totalBytes / usage.limitBytes) * 100).toFixed(2)
                },

                fileUsage: cloudStorageMB,
                isCloud: true,
                counts: {
                    users: userCount,
                    orders: requestCount,
                    services: serviceCount
                }
            });

        } catch (err: any) {
            console.error('Failed to fetch UT usage:', err);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


