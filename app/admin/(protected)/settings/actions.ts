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

        // Save Min Recharge
        const minRecharge = formData.get('min_recharge') as string;
        if (minRecharge) {
            await prisma.systemSetting.upsert({
                where: { key: 'min_recharge' },
                update: { value: minRecharge },
                create: { key: 'min_recharge', value: minRecharge }
            });
        }

        // Save Server Status with Grace Period Logic
        const serverStatus = formData.get('server_status') as string;
        const gracePeriod = parseInt(formData.get('grace_period') as string || '0');

        if (serverStatus) {
            if (gracePeriod > 0) {
                // Scheduled Maintenance
                const triggerTime = new Date(Date.now() + gracePeriod * 60 * 1000).toISOString();

                await prisma.systemSetting.upsert({
                    where: { key: 'maintenance_pending_status' },
                    update: { value: serverStatus },
                    create: { key: 'maintenance_pending_status', value: serverStatus }
                });

                await prisma.systemSetting.upsert({
                    where: { key: 'maintenance_trigger_time' },
                    update: { value: triggerTime },
                    create: { key: 'maintenance_trigger_time', value: triggerTime }
                });

                // Set Start Time to match Trigger Time
                await prisma.systemSetting.upsert({
                    where: { key: 'maintenance_start_time' },
                    update: { value: triggerTime },
                    create: { key: 'maintenance_start_time', value: triggerTime }
                });

                // Ensure current status remains active until trigger
                // Optionally we could set a flag like "maintenance_scheduled" but checking the trigger_time is enough
            } else {
                // Immediate Change
                // Immediate Change
                await prisma.systemSetting.upsert({
                    where: { key: 'server_status' },
                    update: { value: serverStatus },
                    create: { key: 'server_status', value: serverStatus }
                });

                // Set Start Time to Now for immediate switch
                const now = new Date().toISOString();
                await prisma.systemSetting.upsert({
                    where: { key: 'maintenance_start_time' },
                    update: { value: now },
                    create: { key: 'maintenance_start_time', value: now }
                });

                // Clear any pending maintenance if switching immediately
                await prisma.systemSetting.deleteMany({
                    where: {
                        key: { in: ['maintenance_pending_status', 'maintenance_trigger_time'] }
                    }
                });
            }
        }

        // Save Terms Content
        const termsContent = formData.get('terms_content') as string;
        if (termsContent !== null) {
            await prisma.systemSetting.upsert({
                where: { key: 'terms_content' },
                update: { value: termsContent },
                create: { key: 'terms_content', value: termsContent }
            });
        }

        // Save Terms Audio URL
        const termsAudioUrl = formData.get('terms_audio_url') as string;
        if (termsAudioUrl !== null) { // Allow empty string to clear it
            await prisma.systemSetting.upsert({
                where: { key: 'terms_audio_url' },
                update: { value: termsAudioUrl },
                create: { key: 'terms_audio_url', value: termsAudioUrl }
            });
        }


        revalidatePath('/admin/settings');
        revalidatePath('/dashboard');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { success: false, error: 'Database error' };
    }
}

// Helper to clear maintenance if switching to ON
// Note: The logic above handles setting keys. If switching to ON (which runs via the same form but falls out of the `if`s if status is ON... wait logic check)
// Actually in the form `serverStatus` logic:
// The code blocks above run `if (serverStatus)`.
// If serverStatus is 'ON', gracePeriod is usually 0 (hidden).
// So it goes to 'else' (Immediate Change).
// Inside 'Immediate Change', it sets server_status to 'ON'.
// AND deletes pending keys.
// But we ALSO need to delete `maintenance_start_time` if status is ON.

// Let's adjust the deleteMany logic in the Immediate block to include 'maintenance_start_time' IF status is ON.
// OR better yet, just always delete it if we are switching status, but re-add it if we just added it? No.
// Correct logic:
// If New Status == ON: Delete StartTime.
// If New Status != ON: Upsert StartTime (which we did above).

// Refactoring the immediate block:
