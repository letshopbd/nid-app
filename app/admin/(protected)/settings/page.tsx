import prisma from '@/app/lib/prisma';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const settings = await prisma.systemSetting.findMany({
        where: {
            key: { in: ['support_whatsapp', 'payment_number', 'min_recharge', 'server_status', 'payment_methods', 'site_notices', 'notice_speed', 'notice_size', 'notice_gap', 'terms_content', 'terms_audio_url', 'maintenance_pending_status', 'maintenance_trigger_time'] }
        }
    });

    const getValue = (key: string) => settings.find(s => s.key === key)?.value || '';

    const whatsapp = getValue('support_whatsapp');
    const paymentNumber = getValue('payment_number');
    const minRecharge = getValue('min_recharge') || '100';


    // Server Status Logic: Prefer pending status if maintenance is scheduled
    const dbServerStatus = getValue('server_status') || 'ON';
    const pendingStatus = getValue('maintenance_pending_status');
    const triggerTimeRaw = getValue('maintenance_trigger_time');

    let serverStatus = dbServerStatus;
    if (pendingStatus && triggerTimeRaw) {
        const triggerTime = new Date(triggerTimeRaw).getTime();
        const now = new Date().getTime();
        if (triggerTime > now) {
            serverStatus = pendingStatus;
        }
    }
    const paymentMethodsRaw = getValue('payment_methods');
    const siteNoticesRaw = getValue('site_notices');
    const termsContent = getValue('terms_content');
    const termsAudioUrl = getValue('terms_audio_url');

    // ... (keep existing JSON parsing logic)
    // Notice Config Defaults
    const noticeSpeed = getValue('notice_speed') || '20';
    const noticeSize = getValue('notice_size') || 'text-sm';
    const noticeGap = getValue('notice_gap') || '4';

    let paymentMethods: string[] = [];
    try {
        paymentMethods = paymentMethodsRaw ? JSON.parse(paymentMethodsRaw) : [];
    } catch (e) {
        paymentMethods = [];
    }

    let siteNotices: string[] = [];
    try {
        siteNotices = siteNoticesRaw ? JSON.parse(siteNoticesRaw) : [];
    } catch (e) {
        siteNotices = [];
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">System Settings</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage global website configurations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Global Configuration</h3>
                    <SettingsForm
                        initialWhatsapp={whatsapp}
                        initialPaymentNumber={paymentNumber}
                        initialMinRecharge={minRecharge}
                        initialServerStatus={serverStatus}
                        initialPaymentMethods={paymentMethods}
                        initialSiteNotices={siteNotices}
                        initialNoticeConfig={{ speed: noticeSpeed, size: noticeSize, gap: noticeGap }}
                        initialTerms={termsContent}
                        initialTermsAudio={termsAudioUrl}
                    />
                </div>
            </div>
        </div>
    );
}
