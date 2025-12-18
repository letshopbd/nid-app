'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Download, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

type RequestStatus = 'PENDING' | 'PAID' | 'COMPLETED';

interface RequestData {
    id: string;
    nid: string;
    dob: string;
    status: RequestStatus;
    pdfPath: string | null;
}

export default function StatusPage() {
    const { id } = useParams();
    const [data, setData] = useState<RequestData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/requests/${id}`);
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (err) {
                console.error('Failed to fetch status');
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        // Poll every 5 seconds
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-red-500">
                Request not found.
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="max-w-md w-full glass bg-white/90 rounded-2xl shadow-xl p-8 text-center space-y-6">

                {data.status === 'PENDING' && (
                    <>
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                            <Clock className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Payment Pending</h2>
                        <p className="text-slate-500">Please complete the payment to proceed.</p>
                        <Link
                            href={`/payment/${id}`}
                            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 transition"
                        >
                            Pay Now
                        </Link>
                        <Link href="/dashboard" className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition flex items-center justify-center">
                            Back to Dashboard
                        </Link>
                    </>
                )}

                {data.status === 'PAID' && (
                    <>
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Processing Request</h2>
                        <p className="text-slate-500">Your payment is verified. We are generating your file.</p>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                            <p>NID: <span className="font-mono font-bold">{data.nid}</span></p>
                            <p>Status: <span className="text-blue-600 font-bold">In Review</span></p>
                        </div>
                        <Link href="/dashboard" className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition flex items-center justify-center">
                            Back to Dashboard
                        </Link>
                    </>
                )}

                {data.status === 'COMPLETED' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Ready to Download</h2>
                        <p className="text-slate-500">Your verified NID copy is ready.</p>

                        {data.pdfPath ? (
                            <a
                                href={data.pdfPath}
                                download
                                className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 hover:shadow-green-500/30 transition transform hover:-translate-y-1"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF
                            </a>
                        ) : (
                            <p className="text-red-500 text-sm">File not found. Please contact support.</p>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
