'use client';

import { useState, useEffect } from 'react';
import { Download, Share2, Clock, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';

// Helper to convert English digits to Bangla (Removed)
const toBanglaDigit = (str: string | number) => str;

// Helper to format date in Bangla
const formatBanglaDate = (dateString: string) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const d = new Date(dateString);
    const day = toBanglaDigit(d.getDate());
    const month = months[d.getMonth()];
    const year = toBanglaDigit(d.getFullYear());
    return `${day} ${month}, ${year}`;
};

// Helper to format date as YYYY-MM-DD
const formatDateISO = (dateString: string) => {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get Bangla label and color for status
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PENDING':
            return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock };
        case 'PAID':
            return { label: 'Paid', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle };
        case 'ACCEPTED':
            return { label: 'Accepted', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle };
        case 'PROCESSING':
            return { label: 'Processing', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Loader2 };
        case 'COMPLETED':
            return { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
        case 'CANCELLED':
            return { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
        default:
            return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertCircle };
    }
};

interface Request {
    id: string;
    nid: string;
    dob: string;
    status: string;
    createdAt: string;
    pdfPath?: string | null;
}

export default function MyFilesPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            // Optimization: Fetch only last 50 requests
            const res = await fetch('/api/user/requests?limit=50');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 5000); // Live update every 5s
        return () => clearInterval(interval);
    }, []);

    if (loading && requests.length === 0) {
        return <div className="p-10 text-center text-slate-400">Loading files...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800">My File List</h1>
                <p className="text-slate-500">History of your verification requests (Auto-updates)</p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#f8f9fa] border-b border-slate-100 text-slate-700 text-sm font-bold">
                            <tr>
                                <th className="p-4 pl-6">Serial</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">NID/BRN Number</th>
                                <th className="p-4">Date of Birth</th>
                                <th className="p-4">Created Date</th>
                                <th className="p-4 text-center">Action / Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map((req, index) => {
                                const statusInfo = getStatusBadge(req.status);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <tr key={req.id} className="hover:bg-slate-50 transition group">
                                        <td className="p-4 pl-6 font-medium text-slate-600">
                                            {toBanglaDigit(index + 1)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            Server Copy (Unofficial)
                                        </td>
                                        <td className="p-4 font-mono font-medium text-slate-700">
                                            {toBanglaDigit(req.nid)}
                                        </td>
                                        <td className="p-4 text-sm font-mono font-medium text-slate-700">
                                            {formatDateISO(req.dob)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {formatBanglaDate(req.createdAt)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {req.status === 'COMPLETED' && req.pdfPath ? (
                                                    <>
                                                        <a
                                                            href={req.pdfPath}
                                                            download
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:border-green-300 transition text-sm font-medium"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Download
                                                        </a>
                                                        <button
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:border-purple-300 transition text-sm font-medium"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                            Share
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusInfo.color}`}>
                                                        <StatusIcon className={`w-3.5 h-3.5 ${req.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                                                        {statusInfo.label}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        No files found. Request a new service.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {requests.map((req, index) => {
                    const statusInfo = getStatusBadge(req.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                        <div key={req.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
                            {/* Header: Serial & Date */}
                            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                                <span className="font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-xs">
                                    Serial: {toBanglaDigit(index + 1)}
                                </span>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatBanglaDate(req.createdAt)}</span>
                                </div>
                            </div>

                            {/* Type & NID */}
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Type</span>
                                    <h3 className="font-bold text-slate-800 text-base mt-0.5">Server Copy (Unofficial)</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">NID Number</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="font-mono font-bold text-slate-700 tracking-wide text-lg bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                {toBanglaDigit(req.nid)}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Date of Birth</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="font-mono font-medium text-slate-700 text-base">
                                                {formatDateISO(req.dob)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Status & Actions */}
                            <div className="pt-2 border-t border-slate-50">
                                {req.status === 'COMPLETED' && req.pdfPath ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Completed</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <a
                                                href={req.pdfPath}
                                                download
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition font-bold text-sm w-full"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </a>
                                            <button
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition font-bold text-sm w-full"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold ${statusInfo.color}`}>
                                        <StatusIcon className={`w-4 h-4 ${req.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                                        {statusInfo.label} - {req.status === 'PROCESSING' ? 'Wait' : 'Processing'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {requests.length === 0 && (
                    <div className="text-center p-10 bg-white rounded-xl border border-slate-100 text-slate-400">
                        No files found.
                    </div>
                )}
            </div>
        </div>
    );
}
