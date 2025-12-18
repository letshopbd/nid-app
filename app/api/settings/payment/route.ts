import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['payment_number', 'payment_methods', 'site_notices', 'notice_speed', 'notice_size', 'notice_gap'] }
            }
        });

        const getValue = (key: string) => settings.find(s => s.key === key)?.value || '';

        const paymentNumber = getValue('payment_number') || '017XXXXXXXX'; // Default
        const paymentMethodsRaw = getValue('payment_methods');
        const siteNoticesRaw = getValue('site_notices');

        const noticeSpeed = getValue('notice_speed') || '20';
        const noticeSize = getValue('notice_size') || 'text-sm';
        const noticeGap = getValue('notice_gap') || '4';

        let paymentMethods: string[] = ['Bkash', 'Nagad']; // Default
        try {
            if (paymentMethodsRaw) {
                paymentMethods = JSON.parse(paymentMethodsRaw);
            }
        } catch (e) {
            console.error('Failed to parse payment methods');
        }

        let siteNotices: string[] = [];
        try {
            if (siteNoticesRaw) {
                siteNotices = JSON.parse(siteNoticesRaw);
            }
        } catch (e) {
            console.error('Failed to parse site notices');
        }

        return NextResponse.json({
            paymentNumber,
            paymentMethods,
            siteNotices,
            noticeConfig: {
                speed: noticeSpeed,
                size: noticeSize,
                gap: noticeGap
            }
        });

    } catch (error) {
        console.error('Failed to fetch payment settings', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
