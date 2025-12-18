'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Download } from 'lucide-react';
import Link from 'next/link';
import SuccessModal from '@/app/components/SuccessModal';
import MessageModal from '@/app/components/MessageModal'; // Import Custom Modal
import ServiceGuard from '@/app/components/ServiceGuard';

export default function ServerCopyPage() {
    const [nid, setNid] = useState('');
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Add state for Error Modal
    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        title: '',
        message: ''
    });

    const [serviceFee, setServiceFee] = useState(20.0);
    const router = useRouter();

    useEffect(() => {
        const fetchFee = async () => {
            try {
                const res = await fetch(`/api/services/status?name=${encodeURIComponent('Server Copy Unofficial')}`);
                const data = await res.json();
                if (data && data.fee !== undefined) {
                    setServiceFee(data.fee);
                }
            } catch (err) {
                console.error('Failed to fetch fee');
            }
        };
        fetchFee();
    }, []);

    // --- Input Handlers ---

    // Track backspace to prevent 'sticky' hyphens
    const [isDeleting, setIsDeleting] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            setIsDeleting(true);
        } else {
            setIsDeleting(false);
        }
    };

    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Month Validation (Prevent > 12)
        if (val.length >= 6) {
            let month = parseInt(val.slice(4, 6));
            if (month > 12) {
                // Reject the last typed digit if it makes month > 12
                // Example: 199913 -> val becomes 19991
                val = val.slice(0, 5);
            }
        }

        // Format Logic
        let formatted = val;

        // If not deleting, auto-append hyphens at boundaries
        if (!isDeleting) {
            if (val.length === 4) {
                formatted = `${val}-`;
            } else if (val.length === 6) {
                formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-`;
            }
            // Fill in hyphen if typing past boundary
            else if (val.length > 4) {
                formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
                if (val.length > 6) {
                    formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 10)}`; // Max 10 chars (YYYY, MM, DD)
                }
            }
        } else {
            // Deleting logic: Standard format but don't force trailing hyphen
            if (val.length > 6) {
                formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6)}`;
            } else if (val.length > 4) {
                formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
            }
        }

        setDob(formatted);
    };

    const showError = (message: string) => {
        setErrorModal({
            isOpen: true,
            title: 'দুঃখিত!', // "Sorry!"
            message: message
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // --- 1. NID Validation (10 or 17 Digits) ---
        if (nid.length !== 10 && nid.length !== 17) {
            showError('এনআইডি নম্বর অবশ্যই ১০ অথবা ১৭ সংখ্যার হতে হবে।');
            setLoading(false);
            return;
        }

        // --- 2. DOB Validation (Format) ---
        if (dob.length !== 10) {
            showError('জন্ম তারিখ সঠিক নয়। ফরম্যাট হতে হবে: YYYY-MM-DD');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nid, dob, fee: serviceFee }),
            });

            if (res.ok) {
                setShowSuccessModal(true);
                try {
                    window.dispatchEvent(new Event('balanceUpdate'));
                } catch (e) {
                    console.error('Error dispatching balance update:', e);
                }
            } else {
                const data = await res.json();
                showError(data.error || 'অনুরোধটি সম্পন্ন করা সম্ভব হয়নি। দয়া করে আবার চেষ্টা করুন।');
            }
        } catch (err) {
            console.error(err);
            showError('কিছু একটা সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setShowSuccessModal(false);
        router.push('/dashboard/my-files');
    };

    return (
        <ServiceGuard serviceName="Server Copy Unofficial">
            <div className="space-y-6">
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={handleModalClose}
                    title="সফলভাবে সম্পন্ন হয়েছে!"
                    message="আপনার অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে।"
                    serviceFee={`${serviceFee.toFixed(2)} ৳`}
                />

                {/* Custom Error Modal */}
                <MessageModal
                    isOpen={errorModal.isOpen}
                    onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                    title={errorModal.title}
                    message={errorModal.message}
                    type="error"
                />

                {/* Header Section */}
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">সার্ভার কপি (আনঅফিসিয়াল)</h1>
                        <p className="text-sm text-slate-500">এনআইডি এবং জন্ম তারিখ দিয়ে সার্ভার কপি তৈরি করুন</p>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Purple Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                        <h2 className="text-xl font-bold mb-1">তথ্য অনুসন্ধান</h2>
                        <p className="text-sm opacity-90">এনআইডি এবং জন্ম তারিখ দিয়ে তথ্য খুঁজুন</p>
                    </div>

                    {/* Form Content */}
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* NID Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    এনআইডি নম্বর *
                                </label>
                                <input
                                    type="number"
                                    value={nid}
                                    onChange={(e) => setNid(e.target.value)}
                                    placeholder="এনআইডি নম্বর লিখুন"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                />
                                <p className="text-xs text-slate-400">অবশ্যই ১০ অথবা ১৭ সংখ্যার হতে হবে।</p>
                            </div>

                            {/* DOB Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    জন্ম তারিখ *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={dob}
                                        onChange={handleDobChange}
                                        onKeyDown={handleKeyDown}
                                        maxLength={10}
                                        placeholder="YYYY-MM-DD"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                    />
                                    <Calendar className="absolute right-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                                </div>
                                <p className="text-xs text-slate-400">Format: YYYY-MM-DD (e.g. 1999-01-01)</p>
                            </div>

                            {/* Fee Info */}
                            <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-between border border-purple-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">সার্ভিস ফি</p>
                                        <p className="text-xs text-slate-500">ওয়ালেট থেকে কেটে নেওয়া হবে</p>
                                    </div>
                                </div>
                                <p className="text-lg font-bold text-purple-700">{serviceFee.toFixed(2)} ৳</p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#00c988] hover:bg-[#00b57a] text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processing...' : 'সাবমিট করুন'}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </ServiceGuard>
    );
}
