'use client';

import { toast } from 'sonner';
import { Save, ArrowUp, ArrowDown, Edit2, Trash2, Check, X, Music, Trash } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/app/components/RichTextEditor';
import { UploadButton } from '@/app/utils/uploadthing-components';
import { updateSettings } from './actions';
import { useTransition, useState, useEffect } from 'react';

interface SettingsFormProps {
    initialWhatsapp: string;
    initialPaymentNumber: string;
    initialMinRecharge: string;
    initialServerStatus: string;
    initialPaymentMethods: string[];
    initialSiteNotices: string[];
    initialNoticeConfig: { speed: string; size: string; gap: string };
    initialTerms: string;
    initialTermsAudio: string;
}

export default function SettingsForm({ initialWhatsapp, initialPaymentNumber, initialMinRecharge, initialServerStatus, initialPaymentMethods, initialSiteNotices, initialNoticeConfig, initialTerms, initialTermsAudio }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition();

    // Controlled State
    const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
    const [paymentNumber, setPaymentNumber] = useState(initialPaymentNumber);
    const [minRecharge, setMinRecharge] = useState(initialMinRecharge);
    const [serverStatus, setServerStatus] = useState(initialServerStatus);
    const [paymentMethods, setPaymentMethods] = useState<string[]>(initialPaymentMethods);
    const [notices, setNotices] = useState<string[]>(initialSiteNotices);
    const [config, setConfig] = useState(initialNoticeConfig);
    const [terms, setTerms] = useState(initialTerms);
    const [termsAudio, setTermsAudio] = useState(initialTermsAudio);
    const [newNotice, setNewNotice] = useState('');

    // Editing State
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editText, setEditText] = useState('');

    // Sync state with server props (initial/revalidate)
    useEffect(() => {
        setWhatsapp(initialWhatsapp);
        setPaymentNumber(initialPaymentNumber);
        setMinRecharge(initialMinRecharge);
        setServerStatus(initialServerStatus);
        setPaymentMethods(initialPaymentMethods);
        setNotices(initialSiteNotices);
        setConfig(initialNoticeConfig);
        setTerms(initialTerms);
        setTermsAudio(initialTermsAudio);
    }, [initialWhatsapp, initialPaymentNumber, initialMinRecharge, initialServerStatus, initialPaymentMethods, initialSiteNotices, initialNoticeConfig, initialTerms, initialTermsAudio]);

    // Live Sync Polling
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Check every 2s with cache busting
                const res = await fetch(`/api/admin/settings?t=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();

                    // Check if inputs are focused to avoid overwriting typing
                    const activeTag = document.activeElement?.tagName;
                    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

                    if (!isTyping) {
                        if (data.server_status) setServerStatus(data.server_status);
                        if (data.support_whatsapp) setWhatsapp(data.support_whatsapp);
                        if (data.payment_number) setPaymentNumber(data.payment_number);
                        if (data.min_recharge) setMinRecharge(data.min_recharge);
                        if (data.payment_methods) setPaymentMethods(data.payment_methods);
                        if (data.terms_content !== undefined) setTerms(data.terms_content);
                        if (data.terms_audio_url !== undefined) setTermsAudio(data.terms_audio_url);
                        if (data.site_notices) setNotices(data.site_notices);
                        if (data.notice_speed) setConfig(prev => ({ ...prev, speed: data.notice_speed }));
                        if (data.notice_size) setConfig(prev => ({ ...prev, size: data.notice_size }));
                        if (data.notice_gap) setConfig(prev => ({ ...prev, gap: data.notice_gap }));
                    } else {
                        // Always update critical status even if typing
                        if (data.server_status) setServerStatus(data.server_status);
                    }
                }
            } catch (error) {
                console.error('Failed to sync settings');
            }
        };

        const interval = setInterval(fetchSettings, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);


    const addNotice = () => {
        if (!newNotice.trim()) return;
        setNotices([...notices, newNotice.trim()]);
        setNewNotice('');
    };

    // ... (keep existing methods: removeNotice, moveNotice, startEdit, saveEdit, cancelEdit, handleMethodToggle) ...

    const removeNotice = (index: number) => {
        setNotices(notices.filter((_, i) => i !== index));
    };

    const moveNotice = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === notices.length - 1) return;

        const newNotices = [...notices];
        const swapIdx = direction === 'up' ? index - 1 : index + 1;

        [newNotices[index], newNotices[swapIdx]] = [newNotices[swapIdx], newNotices[index]];
        setNotices(newNotices);
    };

    const startEdit = (index: number) => {
        setEditIdx(index);
        setEditText(notices[index]);
    };

    const saveEdit = () => {
        if (editIdx === null || !editText.trim()) return;
        const newNotices = [...notices];
        newNotices[editIdx] = editText.trim();
        setNotices(newNotices);
        setEditIdx(null);
        setEditText('');
    };

    const cancelEdit = () => {
        setEditIdx(null);
        setEditText('');
    };

    const handleMethodToggle = (method: string) => {
        if (paymentMethods.includes(method)) {
            setPaymentMethods(paymentMethods.filter(m => m !== method));
        } else {
            setPaymentMethods([...paymentMethods, method]);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        formData.set('site_notices', JSON.stringify(notices));
        formData.set('terms_content', terms);
        formData.set('terms_audio_url', termsAudio);

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
        <form action={handleSubmit} className="space-y-8 max-w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column: Server Status + Support Settings */}
                <div className="space-y-6">
                    {/* Server Status */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center gap-2">
                            Server Status
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {['ON', 'DEV', 'DOWN'].map((status) => (
                                <label key={status} className={`
                                    flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border-2 transition
                                    ${serverStatus === status ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}
                                `}>
                                    <input
                                        type="radio"
                                        name="server_status"
                                        value={status}
                                        checked={serverStatus === status}
                                        onChange={(e) => setServerStatus(e.target.value)}
                                        className="hidden"
                                    />
                                    <span className="font-bold text-sm">{status}</span>
                                    <span className="text-[10px] uppercase font-bold mt-1 opacity-70">
                                        {status === 'ON' ? 'Live' : status === 'DEV' ? 'Maintenance' : 'Service Slow'}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {/* Set Time Field (Integrated) */}
                        <div className={`mt-4 pt-4 border-t border-slate-100 transition-all ${serverStatus === 'DEV' ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                                <span>Set Time (Minutes)</span>
                                {serverStatus === 'DEV' && <span className="text-xs text-blue-600 font-normal animate-pulse">Active for Dev Mode</span>}
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    name="grace_period"
                                    defaultValue="0"
                                    min="0"
                                    max="120"
                                    disabled={serverStatus !== 'DEV'}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-lg disabled:cursor-not-allowed disabled:bg-slate-100"
                                    placeholder="Enter minutes (e.g. 5)"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">
                                Only editable in Dev Mode. Users will see a countdown before access is restricted.
                            </p>
                        </div>

                        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                            <strong>Live:</strong> Normal operation. <br />
                            <strong>Maintenance:</strong> Admins only. (Set time for graceful entry) <br />
                            <strong>Service Slow:</strong> Site is accessible, but marked as Down/Slow.
                        </p>
                    </div>

                    {/* Support Contact */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center gap-2">
                            Support Contact
                        </h4>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                WhatsApp Number
                            </label>
                            <input
                                type="text"
                                name="support_whatsapp"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="+8801700000000"
                                disabled={isPending}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-medium text-slate-800 bg-white"
                            />
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                This number will be displayed to suspended users for contact.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment Settings */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center gap-2">
                        Payment Settings
                    </h4>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Payment Number (Send Money)
                            </label>
                            <input
                                type="text"
                                name="payment_number"
                                value={paymentNumber}
                                onChange={(e) => setPaymentNumber(e.target.value)}
                                placeholder="01XXXXXXXXX"
                                disabled={isPending}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-medium text-slate-800 bg-white"
                            />
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                This number will be shown on the user recharge page.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Minimum Recharge Amount
                            </label>
                            <input
                                type="number"
                                name="min_recharge"
                                value={minRecharge}
                                onChange={(e) => setMinRecharge(e.target.value)}
                                placeholder="100"
                                disabled={isPending}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-medium text-slate-800 bg-white"
                            />
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Users cannot recharge less than this amount.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">
                                Active Payment Methods
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Bkash', 'Nagad', 'Rocket', 'Upay'].map((method) => (
                                    <label key={method} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-white hover:border-blue-300 hover:shadow-sm transition bg-white/50">
                                        <input
                                            type="checkbox"
                                            name={`method_${method}`}
                                            checked={paymentMethods.includes(method)}
                                            onChange={() => handleMethodToggle(method)}
                                            disabled={isPending}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-sm font-bold text-slate-700">{method}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-100 my-6"></div>

            {/* ... Site Notices ... */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 tracking-wider">Notices</h4>
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            type="text"
                            value={newNotice}
                            onChange={(e) => setNewNotice(e.target.value)}
                            placeholder="Type a new notice..."
                            disabled={isPending}
                            className="w-full md:flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNotice())}
                        />
                        <button
                            type="button"
                            onClick={addNotice}
                            disabled={isPending || !newNotice.trim()}
                            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                {editIdx === idx ? (
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="flex-1 px-2 py-1 text-sm border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                                            autoFocus
                                        />
                                        <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-800 font-medium break-all mr-2">{notice}</span>
                                )}

                                {editIdx !== idx && (
                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => moveNotice(idx, 'up')}
                                            disabled={idx === 0}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveNotice(idx, 'down')}
                                            disabled={idx === notices.length - 1}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(idx)}
                                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeNotice(idx)}
                                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400">
                        These notices will scroll endlessly at the top of the user dashboard.
                    </p>
                </div>
            </div>

            <div className="h-px bg-slate-100 my-6"></div>

            {/* ... Notice Configuration ... */}
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
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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

            <div className="h-px bg-slate-100 my-6"></div>

            {/* Terms & Conditions */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 tracking-wider">Terms & Conditions</h4>
                <div className="space-y-6">
                    {/* Editor */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Page Content (Rich Text)
                        </label>
                        <RichTextEditor
                            value={terms}
                            onChange={setTerms}
                            disabled={isPending}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Use the toolbar to format your text with headings, colors, lists, etc.
                        </p>
                    </div>

                    {/* Audio Upload */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Music className="w-4 h-4 text-blue-600" />
                            Audio Version (MP3)
                        </label>

                        {termsAudio ? (
                            <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                                <audio controls src={termsAudio} className="h-10 w-full max-w-xs" />
                                <button
                                    type="button"
                                    onClick={() => setTermsAudio('')}
                                    disabled={isPending}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Remove Audio"
                                >
                                    <Trash className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <UploadButton
                                endpoint="audioUploader"
                                onClientUploadComplete={(res) => {
                                    if (res && res[0]) {
                                        setTermsAudio(res[0].url);
                                        toast.success("Audio uploaded!");
                                    }
                                }}
                                onUploadError={(error: Error) => {
                                    toast.error(`Upload failed: ${error.message}`);
                                }}
                                appearance={{
                                    button: "bg-slate-800 hover:bg-slate-900 text-white text-sm px-4 py-2 rounded-lg transition",
                                    allowedContent: "text-slate-500 text-xs"
                                }}
                            />
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                            Upload an MP3 so users can listen to the terms instead of reading. Max 16MB.
                        </p>
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
        </form >
    );
}
