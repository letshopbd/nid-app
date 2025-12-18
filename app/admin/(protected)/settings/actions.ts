'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSettings(formData: FormData) {
    const whatsapp = formData.get('support_whatsapp') as string;
    const paymentNumber = formData.get('payment_number') as string;

    // Collect checked methods
    const methods = [];
    if (formData.get('method_Bkash') === 'on') methods.push('Bkash');
    if (formData.get('method_Nagad') === 'on') methods.push('Nagad');
    if (formData.get('method_Rocket') === 'on') methods.push('Rocket');
    if (formData.get('method_Upay') === 'on') methods.push('Upay');

    try {
        // Save WhatsApp
        if (whatsapp) {
            await prisma.systemSetting.upsert({
                where: { key: 'support_whatsapp' },
                update: { value: whatsapp },
                create: { key: 'support_whatsapp', value: whatsapp }
            });
        }

        // Save Payment Number
        if (paymentNumber) {
            await prisma.systemSetting.upsert({
                where: { key: 'payment_number' },
                update: { value: paymentNumber },
                create: { key: 'payment_number', value: paymentNumber }
            });
        }

        // Save Payment Methods
        await prisma.systemSetting.upsert({
            where: { key: 'payment_methods' },
            update: { value: JSON.stringify(methods) },
            create: { key: 'payment_methods', value: JSON.stringify(methods) }
        });

        // Save Site Notices
        const noticesRaw = formData.get('site_notices') as string;
        if (noticesRaw) {
            // Validate it is valid JSON if possible, or just string
            // The form will send it as a JSON stringified array of strings
            await prisma.systemSetting.upsert({
                where: { key: 'site_notices' },
                update: { value: noticesRaw },
                create: { key: 'site_notices', value: noticesRaw }
            });
        }

        // Save Notice Config (Speed, Size, Gap)
        const speed = formData.get('notice_speed') as string;
        const size = formData.get('notice_size') as string;
        const gap = formData.get('notice_gap') as string;

        if (speed) await prisma.systemSetting.upsert({ where: { key: 'notice_speed' }, update: { value: speed }, create: { key: 'notice_speed', value: speed } });
        if (size) await prisma.systemSetting.upsert({ where: { key: 'notice_size' }, update: { value: size }, create: { key: 'notice_size', value: size } });
        if (gap) await prisma.systemSetting.upsert({ where: { key: 'notice_gap' }, update: { value: gap }, create: { key: 'notice_gap', value: gap } });


        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { success: false, error: 'Database error' };
    }
}
