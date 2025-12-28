import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        // Strict Admin Check
        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: [
                        'server_status',
                        'support_whatsapp',
                        'payment_number',
                        'min_recharge',
                        'payment_methods',
                        'terms_content',
                        'terms_audio_url',
                        'site_notices',
                        'notice_speed',
                        'notice_size',
                        'notice_gap',
                        // We can also fetch maintenance stuff if needed for the 'grace period' display
                        'maintenance_trigger_time',
                        'maintenance_pending_status'
                    ]
                }
            }
        });

        const getValue = (key: string) => settings.find(s => s.key === key)?.value || '';

        // Parse JSON lists safely
        const parseList = (key: string, defaultVal: string[]) => {
            const val = getValue(key);
            if (!val) return defaultVal;
            try { return JSON.parse(val); } catch { return defaultVal; }
        };

        return NextResponse.json({
            server_status: getValue('server_status') || 'ON',
            maintenance_trigger_time: getValue('maintenance_trigger_time'),
            maintenance_pending_status: getValue('maintenance_pending_status'),

            support_whatsapp: getValue('support_whatsapp'),

            payment_number: getValue('payment_number'),
            min_recharge: getValue('min_recharge'),
            payment_methods: parseList('payment_methods', ['Bkash', 'Nagad']),

            terms_content: getValue('terms_content'),
            terms_audio_url: getValue('terms_audio_url'),

            site_notices: parseList('site_notices', []),
            notice_speed: getValue('notice_speed') || '20',
            notice_size: getValue('notice_size') || 'text-sm',
            notice_gap: getValue('notice_gap') || '4',
        });

    } catch (error) {
        console.error('Failed to fetch admin settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
