'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PaymentPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [bkashNumber, setBkashNumber] = useState('');
    const [pin, setPin] = useState('');

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate payment processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        try {
            // Create FormData to match the PATCH endpoint requirement
            const formData = new FormData();
            formData.append('status', 'PAID');

            const res = await fetch(`/api/requests/${id}`, {
                method: 'PATCH',
                body: formData,
            });

            if (!res.ok) throw new Error('Payment failed');

            router.push(`/status/${id}`);
        } catch (err) {
            alert('Payment failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-[#E2136E] rounded-md shadow-2xl overflow-hidden text-white font-sans">
                <div className="p-6 text-center border-b border-white/20">
                    <div className="flex justify-center mb-4">
                        {/* Simple Bkash Logo SVG Placeholder */}
                        <div className="bg-white p-2 rounded w-16 h-16 flex items-center justify-center text-[#E2136E] font-bold text-xs">
                            bKash
                        </div>
                    </div>
                    <h2 className="text-xl font-bold">Merchant Payment</h2>
                    <p className="text-sm opacity-90 mt-1">NID Service Charge: ৳ 100.00</p>
                </div>

                <form onSubmit={handlePayment} className="p-6 bg-white text-slate-800 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Your bKash Account Number</label>
                        <input
                            type="text"
                            value={bkashNumber}
                            onChange={(e) => setBkashNumber(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full p-3 bg-slate-100 border-b-2 border-slate-300 focus:border-[#E2136E] outline-none transition text-lg"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">PIN</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="XXXXX"
                            className="w-full p-3 bg-slate-100 border-b-2 border-slate-300 focus:border-[#E2136E] outline-none transition text-lg tracking-widest"
                            required
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#E2136E] text-white py-3 font-bold uppercase tracking-wide hover:bg-[#c2105e] transition disabled:opacity-70"
                        >
                            {loading ? 'Processing...' : 'Confirm'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 bg-slate-200 text-slate-600 py-3 font-bold uppercase tracking-wide hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
