'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Correct import for App Router
import { CreditCard, ArrowRight, Loader2 } from 'lucide-react';

export default function PaymentPage() {
    const params = useParams();
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/requests/${params.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, transactionId }),
            });

            if (res.ok) {
                // Redirect to My Files on success
                router.push('/dashboard/my-files');
            } else {
                const data = await res.json();
                alert(data.error || 'Payment submission failed');
            }
        } catch (error) {
            console.error('Error submitting payment:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Payment Verification</h1>
                <p className="text-slate-500">Please complete your payment to proceed.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <strong>Instructions:</strong> Send the service fee to our Bkash/Nagad number 01516-562768 (Personal). Then enter the number you sent from and the Transaction ID below.
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Phone Number *</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Transaction ID (TrxID) *</label>
                        <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g. 9X7D6F5G"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-purple-600 text-white rounded-lg font-bold shadow-md hover:bg-purple-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                            </>
                        ) : (
                            <>
                                Verify Payment <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
