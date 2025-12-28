'use client';

import { FileText, Search, Calendar, Download } from 'lucide-react';
import ServiceGuard from '@/app/components/ServiceGuard';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SuccessModal from '@/app/components/SuccessModal';
import MessageModal from '@/app/components/MessageModal';

export default function BirthRegistrationPage() {
    const router = useRouter();
    const [brn, setBrn] = useState('');
    const [dob, setDob] = useState('');

    // Fee State
    const [serviceFee, setServiceFee] = useState(0);
    const [feeLoading, setFeeLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    const [isDeleting, setIsDeleting] = useState(false);

    // Modal States
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [messageModal, setMessageModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info'
    });

    // Fetch Fee
    useEffect(() => {
        const fetchFee = async () => {
            try {
                const res = await fetch(`/api/services/status?name=${encodeURIComponent('Birth Registration')}`);
                const data = await res.json();
                if (data && data.fee !== undefined) {
                    setServiceFee(data.fee);
                }
            } catch (err) {
                console.error('Failed to fetch fee');
            } finally {
                setFeeLoading(false);
            }
        };
        fetchFee();
    }, []);

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
                val = val.slice(0, 5);
            }
        }

        // Format Logic
        let formatted = val;

        if (!isDeleting) {
            if (val.length === 4) {
                formatted = `${val}-`;
            } else if (val.length === 6) {
                formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-`;
            } else if (val.length > 4) {
                formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
                if (val.length > 6) {
                    formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 10)}`;
                }
            }
        } else {
            if (val.length > 6) {
                formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 10)}`;
            } else if (val.length > 4) {
                formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
            }
        }

        setDob(formatted);
    };

    const showError = (message: string) => {
        setMessageModal({
            isOpen: true,
            title: 'Error',
            message,
            type: 'error'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!brn || !dob) {
            showError('Please fill in all fields');
            return;
        }

        if (brn.length !== 17 || !/^\d+$/.test(brn)) {
            showError('Birth Registration Number must be exactly 17 digits');
            return;
        }

        if (dob.length !== 10) {
            showError('Invalid date of birth. Format must be: YYYY-MM-DD');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nid: brn, // Mapping BRN to NID fields for reusability on backend
                    dob,
                    service: 'Birth Registration'
                }),
            });

            if (res.ok) {
                setShowSuccessModal(true);
                // Trigger balance update if possible
                try {
                    window.dispatchEvent(new Event('balanceUpdate'));
                } catch (e) { }
            } else {
                const data = await res.json();
                showError(data.error || 'Request could not be processed. Please try again.');
            }
        } catch (err) {
            showError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        router.push('/dashboard/my-files');
    };

    return (
        <ServiceGuard serviceName="Birth Registration">
            <div className="space-y-6">
                {/* Modals */}
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={handleSuccessClose}
                    title="Successfully Completed!"
                    message="Your request has been accepted successfully."
                    serviceFee={`${serviceFee.toFixed(2)} ৳`}
                />

                <MessageModal
                    isOpen={messageModal.isOpen}
                    onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
                    title={messageModal.title}
                    message={messageModal.message}
                    type={messageModal.type}
                />

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Birth Registration</h1>
                    <p className="text-sm text-slate-500">Verify and download Birth Registration Certificate</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-white">
                        <h2 className="text-xl font-bold mb-1">Verify Information</h2>
                        <p className="text-green-50 text-sm">Enter details to search for birth record</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Birth Registration Number (17 Digits) *</label>
                                <input
                                    type="text"
                                    value={brn}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 17);
                                        setBrn(val);
                                    }}
                                    placeholder="Enter 17-digit number"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-green-500 text-sm focus:ring-1 focus:ring-green-500 font-mono tracking-wide"
                                />
                                <p className="text-xs text-slate-400 text-right">{brn.length}/17</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Date of Birth *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={dob}
                                        onChange={handleDobChange}
                                        onKeyDown={handleKeyDown}
                                        maxLength={10}
                                        placeholder="YYYY-MM-DD"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-green-500 text-sm focus:ring-1 focus:ring-green-500"
                                    />
                                    <Calendar className="absolute right-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                                </div>
                                <p className="text-xs text-slate-400">Format: YYYY-MM-DD (e.g., 2005-01-01)</p>
                            </div>
                        </div>

                        {/* Fee Info */}
                        <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between border border-green-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <Download className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Service Fee</p>
                                    <p className="text-xs text-slate-500">Will be deducted from wallet</p>
                                </div>
                            </div>
                            <p className="text-lg font-bold text-green-700">
                                {feeLoading ? (
                                    <span className="animate-pulse">...</span>
                                ) : (
                                    `${serviceFee.toFixed(2)} ৳`
                                )}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Search className="w-5 h-5" />
                            {loading ? 'Processing...' : 'Submit'}
                        </button>
                    </form>
                </div>
            </div>
        </ServiceGuard>
    );
}
