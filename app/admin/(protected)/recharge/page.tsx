'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, RefreshCw, Smartphone } from 'lucide-react';

interface RechargeRequest {
    id: string;
    orderId: string | null;
    amount: number;
    transactionId: string;
    paymentNumber?: string;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
}

export default function AdminRechargePage() {
    const [requests, setRequests] = useState<RechargeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    // Modal States
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null; status: 'APPROVED' | 'REJECTED' | null }>({ isOpen: false, id: null, status: null });
    const [msgModal, setMsgModal] = useState<{ isOpen: boolean; title: string; msg: string; type: 'success' | 'error' }>({ isOpen: false, title: '', msg: '', type: 'success' });

    const fetchRequests = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch('/api/admin/recharge');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to load requests');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(true);
        const interval = setInterval(() => fetchRequests(false), 5000);
        return () => clearInterval(interval);
    }, []);

    const confirmAction = (id: string, status: 'APPROVED' | 'REJECTED') => {
        setConfirmModal({ isOpen: true, id, status });
    };

    const handleStatusUpdate = async () => {
        const { id, status } = confirmModal;
        if (!id || !status) return;

        setConfirmModal(prev => ({ ...prev, isOpen: false })); // Close confirm modal

        try {
            const res = await fetch('/api/admin/recharge', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });

            if (res.ok) {
                // Optimistic update
                setRequests(prev => prev.map(req => req.id === id ? { ...req, status: status } : req));
                setMsgModal({
                    isOpen: true,
                    title: status === 'APPROVED' ? 'সফল!' : 'বাতিল করা হয়েছে',
                    msg: status === 'APPROVED' ? 'ব্যালেন্স সফলভাবে যুক্ত হয়েছে।' : 'অনুরোধটি বাতিল করা হয়েছে।',
                    type: 'success'
                });
            } else {
                const data = await res.json();
                setMsgModal({ isOpen: true, title: 'ব্যর্থ!', msg: data.error || 'আপডেট করা সম্ভব হয়নি', type: 'error' });
            }
        } catch (error) {
            setMsgModal({ isOpen: true, title: 'ত্রুটি', msg: 'সার্ভারে সমস্যা হয়েছে।', type: 'error' });
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'ALL') return true;
        return req.status === filter;
    });

    return (
        <div className="space-y-6 relative">
            {/* Custom Modals */}
            {msgModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                        <h3 className={`text-lg font-bold mb-2 ${msgModal.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{msgModal.title}</h3>
                        <p className="text-slate-500 mb-6">{msgModal.msg}</p>
                        <button onClick={() => setMsgModal(m => ({ ...m, isOpen: false }))} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Close</button>
                    </div>
                </div>
            )}

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">নিশ্চিত করুন?</h3>
                        <p className="text-slate-500 mb-6">আপনি কি এই অনুরোধটি {confirmModal.status === 'APPROVED' ? 'অনুমোদন' : 'বাতিল'} করতে চান?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal({ isOpen: false, id: null, status: null })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">না</button>
                            <button onClick={handleStatusUpdate} className={`flex-1 py-3 text-white rounded-xl font-bold ${confirmModal.status === 'APPROVED' ? 'bg-green-600' : 'bg-red-600'}`}>হ্যাঁ, করুন</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Recharge Requests</h2>
                        <p className="text-sm text-slate-500">Manage user balance add requests</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <button
                            onClick={() => fetchRequests()}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-sm bg-slate-50/50">
                                <th className="p-4 font-semibold">User</th>
                                <th className="p-4 font-semibold">Order ID</th>
                                <th className="p-4 font-semibold">Transaction Info</th>
                                <th className="p-4 font-semibold">Amount</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold text-center">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{req.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-slate-400">{req.user?.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                            {req.orderId || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-mono font-bold text-slate-700 tracking-wide">{req.transactionId}</div>
                                        {req.paymentNumber && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                <Smartphone className="w-3 h-3" /> {req.paymentNumber}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-bold text-green-600">
                                        ৳ {req.amount}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold 
                                            ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {req.status === 'PENDING' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => confirmAction(req.id, 'APPROVED')}
                                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => confirmAction(req.id, 'REJECTED')}
                                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        No recharge requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">Recharge</h2>
                    <div className="flex items-center gap-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Done</option>
                        </select>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                            {filteredRequests.length}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading requests...</div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            #{req.orderId || 'N/A'}
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                            ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div className="font-bold text-slate-800">{req.user?.name || 'Unknown'}</div>
                                    <div className="text-xs text-slate-500">{req.user?.email}</div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-green-600 text-lg">৳{req.amount}</span>
                                    <div className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Smartphone className="w-4 h-4 text-slate-400" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 font-mono tracking-wide">{req.transactionId}</span>
                                        {req.paymentNumber && <span className="text-xs text-slate-500">{req.paymentNumber}</span>}
                                    </div>
                                </div>
                            </div>

                            {req.status === 'PENDING' && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        onClick={() => confirmAction(req.id, 'APPROVED')}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-sm shadow-sm hover:shadow-md"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => confirmAction(req.id, 'REJECTED')}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-bold text-sm"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
