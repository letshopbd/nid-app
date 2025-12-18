'use client';

import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { updateSettings } from './actions';
import { useTransition, useState, useEffect } from 'react';

interface SettingsFormProps {
    initialWhatsapp: string;
    initialPaymentNumber: string;
    initialPaymentMethods: string[]; // ['Bkash', 'Nagad']
    initialSiteNotices: string[];
    initialNoticeConfig: { speed: string; size: string; gap: string };
}

export default function SettingsForm({ initialWhatsapp, initialPaymentNumber, initialPaymentMethods, initialSiteNotices, initialNoticeConfig }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition();
    const [notices, setNotices] = useState<string[]>(initialSiteNotices);
    const [config, setConfig] = useState(initialNoticeConfig);
    const [newNotice, setNewNotice] = useState('');

    // Sync state with server props on revalidation
    useEffect(() => {
        setNotices(initialSiteNotices);
        setConfig(initialNoticeConfig);
    }, [initialSiteNotices, initialNoticeConfig]);

    const addNotice = () => {
        if (!newNotice.trim()) return;
        setNotices([...notices, newNotice.trim()]);
        setNewNotice('');
    };

    const removeNotice = (index: number) => {
        setNotices(notices.filter((_, i) => i !== index));
    };

    const handleSubmit = async (formData: FormData) => {
        formData.set('site_notices', JSON.stringify(notices)); // Manually add notices to formData
        startTransition(async () => {
            const result = await updateSettings(formData);
            if (result?.success) {
                toast.success('Settings updated successfully!');
            } else {
                toast.error('Failed to update settings.');
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-8 max-w-lg">
            {/* Support Settings */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 tracking-wider">Support Contact</h4>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        WhatsApp Number
                    </label>
                    <input
                        type="text"
                        name="support_whatsapp"
                        defaultValue={initialWhatsapp}
                        placeholder="+8801700000000"
                        disabled={isPending}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        This number will be displayed to suspended users.
                    </p>
                </div>
            </div>

            <div className="h-px bg-slate-100 my-6"></div>

            {/* Payment Settings */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 tracking-wider">Payment Settings</h4>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Payment Number (Send Money)
                        </label>
                        <input
                            type="text"
                            name="payment_number"
                            defaultValue={initialPaymentNumber}
                            placeholder="01XXXXXXXXX"
                            disabled={isPending}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            This number will be shown on the user recharge page.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Active Payment Methods
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Bkash', 'Nagad', 'Rocket', 'Upay'].map((method) => (
                                <label key={method} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="checkbox"
                                        name={`method_${method}`}
                                        defaultChecked={initialPaymentMethods.includes(method)}
                                        disabled={isPending}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{method}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-100 my-6"></div>

            {/* Site Notices */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 tracking-wider">Scrolling Notices</h4>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newNotice}
                            onChange={(e) => setNewNotice(e.target.value)}
                            placeholder="Type a new notice..."
                            disabled={isPending}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNotice())}
                        />
                        <button
                            type="button"
                            onClick={addNotice}
                            disabled={isPending || !newNotice.trim()}
                            className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add
                        </button>
                    </div>

                    <div className="space-y-2">
                        {notices.length === 0 && (
                            <p className="text-sm text-slate-400 italic">No notices active.</p>
                        )}
                        {notices.map((notice, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg group">
                                <span className="text-sm text-slate-800 font-medium">{notice}</span>
                                <button
                                    type="button"
                                    onClick={() => removeNotice(idx)}
                                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400">
                        These notices will scroll endlessly at the top of the user dashboard.
                    </p>
                </div>
            </div>

            <div className="h-px bg-slate-100 my-6"></div>

            {/* Notice Configuration */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 tracking-wider">Notice Appearance</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Display Duration */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Display Duration (Seconds)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                name="notice_speed"
                                min="2"
                                max="20"
                                step="1"
                                value={config.speed}
                                onChange={(e) => setConfig({ ...config, speed: e.target.value })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-bold text-slate-600 w-8">{config.speed}s</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Time each notice stays visible</p>
                    </div>

                    {/* Text Size */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Text Size
                        </label>
                        <select
                            name="notice_size"
                            value={config.size}
                            onChange={(e) => setConfig({ ...config, size: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                        >
                            <option value="text-xs">Small (XS)</option>
                            <option value="text-sm">Normal (SM)</option>
                            <option value="text-base">Large (Base)</option>
                            <option value="text-lg">Extra Large (LG)</option>
                        </select>
                    </div>

                    {/* Separator Gap (Hidden) */}
                    <div className="hidden">
                        <input type="hidden" name="notice_gap" value={config.gap} />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
            >
                <Save className="w-4 h-4" />
                {isPending ? 'Saving Changes...' : 'Save All Settings'}
            </button>
        </form>
    );
}
