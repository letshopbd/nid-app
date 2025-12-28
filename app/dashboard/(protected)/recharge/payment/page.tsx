'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, CheckCircle, Smartphone } from 'lucide-react';
import Link from 'next/link';
import MessageModal from '@/app/components/MessageModal';

function PaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const amount = searchParams.get('amount') || '';
    const [trxID, setTrxID] = useState('');
    const [paymentNumber, setPaymentNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [msgModal, setMsgModal] = useState<{ isOpen: boolean; title: string; msg: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', msg: '', type: 'info' });

    const [adminNumber, setAdminNumber] = useState('017XXXXXXXX');
    const [methods, setMethods] = useState<string[]>(['Bkash', 'Nagad']);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/settings/payment?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setAdminNumber(data.paymentNumber);
                    setMethods(data.paymentMethods);
                }
            } catch (error) {
                console.error('Failed to load payment settings');
            }
        };

        fetchSettings();
        const interval = setInterval(fetchSettings, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(adminNumber);
        setMsgModal({
            isOpen: true,

            title: 'Copied',
            msg: 'Number copied to clipboard.',
            type: 'success'
        });
    };

    const handleSuccessClose = () => {
        setMsgModal(m => ({ ...m, isOpen: false }));
        if (msgModal.type === 'success' && msgModal.title === 'Success!') {
            router.push('/dashboard/recharge');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/user/recharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    transactionId: trxID,
                    paymentNumber
                }),
            });

            if (res.ok) {
                setMsgModal({
                    isOpen: true,

                    title: 'Success!',
                    msg: 'Your recharge request has been submitted successfully. Please wait.',
                    type: 'success'
                });
            } else {
                const data = await res.json();
                setMsgModal({
                    isOpen: true,

                    title: 'Failed!',
                    msg: data.error || 'Request could not be submitted.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error(error);
            setMsgModal({
                isOpen: true,

                title: 'Error',
                msg: 'Server error.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const methodsString = methods.length > 0 ? `(${methods.join('/')})` : '';

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <MessageModal
                isOpen={msgModal.isOpen}
                onClose={handleSuccessClose}
                title={msgModal.title}
                message={msgModal.msg}
                type={msgModal.type}
            />

            {/* Header */}
            <div className="flex items-center gap-2">
                <Link href="/dashboard/recharge" className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-bold text-slate-800">Complete Payment</h1>
            </div>

            {/* Instruction Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <div className="text-center space-y-2">
                    <p className="text-slate-500 text-sm">Amount</p>
                    <p className="text-3xl font-bold text-slate-800">৳ {amount}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between border border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Send Money To {methodsString}</p>
                            <p className="text-lg font-bold text-slate-800 tracking-wide">{adminNumber}</p>
                        </div>
                    </div>
                    <button onClick={handleCopy} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition" title="Copy Number">
                        <Copy className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="font-bold mb-1">Instructions:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Send Money to the above number.</li>
                        <li>Amount must be <strong>{amount}</strong> Taka.</li>
                        <li>Enter Transaction ID in the form below after payment.</li>
                    </ul>
                </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Transaction ID</label>
                    <input
                        type="text"
                        value={trxID}
                        onChange={(e) => setTrxID(e.target.value)}
                        placeholder="Ex: 9H7G6F5D"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition font-mono uppercase"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Sender Number (Optional)</label>
                    <input
                        type="text"
                        value={paymentNumber}
                        onChange={(e) => setPaymentNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !trxID}
                    className="w-full py-4 bg-[#e91e63] hover:bg-[#d81b60] text-white font-bold rounded-xl transition shadow-lg shadow-pink-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? 'Verifying...' : 'Verify Payment'}
                </button>
            </form>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading payment...</div>}>
            <PaymentContent />
        </Suspense>
    );
}
