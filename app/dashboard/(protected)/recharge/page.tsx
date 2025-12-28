'use client';

import { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RechargeRequest {
    id: string;
    orderId?: string | null;
    amount: number;
    transactionId: string;
    status: string;
    createdAt: string;
    paymentNumber?: string;
}

import MessageModal from '@/app/components/MessageModal';

export default function RechargePage() {
    const router = useRouter();
    const [customAmount, setCustomAmount] = useState('');
    const [history, setHistory] = useState<RechargeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [minRecharge, setMinRecharge] = useState(100);
    const [msgModal, setMsgModal] = useState<{ isOpen: boolean; title: string; msg: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', msg: '', type: 'info' });

    useEffect(() => {
        // Fetch Min Recharge Setting
        const fetchSettings = () => {
            fetch('/api/settings/payment')
                .then(res => res.json())
                .then(data => {
                    if (data.minRecharge) setMinRecharge(Number(data.minRecharge));
                })
                .catch(err => console.error('Failed to fetch settings', err));
        };

        fetchSettings();
        const interval = setInterval(fetchSettings, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleRecharge = (amount: string) => {
        const val = amount.replace(/,/g, '');
        if (Number(val) < minRecharge) {
            setMsgModal({
                isOpen: true,
                title: 'Warning',
                msg: `Minimum recharge amount is ${minRecharge} Taka.`,
                type: 'error'
            });
            return;
        }
        router.push(`/dashboard/recharge/payment?amount=${val}`);
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Optimization: Fetch only last 50 transactions for history
                const res = await fetch('/api/user/recharge?limit=50');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error('Failed to load history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Polling for status updates
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8">
            <MessageModal
                isOpen={msgModal.isOpen}
                onClose={() => setMsgModal(m => ({ ...m, isOpen: false }))}
                title={msgModal.title}
                message={msgModal.msg}
                type={msgModal.type}
            />

            <h1 className="text-2xl font-bold text-slate-900">Recharge History</h1>

            {/* Cards Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Custom Recharge */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 flex flex-col h-full">
                    <h2 className="text-lg font-bold text-slate-800">Custom Recharge</h2>
                    <div className="flex-1 flex flex-col justify-center space-y-6">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                            <input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder={`Enter amount (Minimum ${minRecharge} Taka)`}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm"
                            />
                        </div>
                        <button
                            onClick={() => handleRecharge(customAmount)}
                            className="w-full py-3 bg-[#e91e63] text-white font-bold rounded-lg hover:bg-[#d81b60] transition shadow-md flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5 -rotate-45" />
                            Recharge
                        </button>
                    </div>
                </div>

                {/* Packages */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <h2 className="text-lg font-bold text-slate-800">Predefined Recharge Packages</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <PackageCard amount="1,000" bonus="30" onClick={() => handleRecharge('1000')} />
                        <PackageCard amount="2,000" bonus="50" onClick={() => handleRecharge('2000')} />
                        <PackageCard amount="3,000" bonus="70" onClick={() => handleRecharge('3000')} />
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">Transaction History</h2>
                </div>
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4 pl-6">Serial No</th>
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Number</th>
                                <th className="p-4">Trx ID</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Time</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {history.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 pl-6 font-mono text-slate-500">#{idx + 1}</td>
                                    <td className="p-4 text-blue-600 font-mono font-bold text-xs">
                                        {item.orderId || <span className="text-slate-400">N/A</span>}
                                    </td>
                                    <td className="p-4 text-slate-700">{item.paymentNumber || 'N/A'}</td>
                                    <td className="p-4 font-mono font-bold text-slate-600">{item.transactionId}</td>
                                    <td className="p-4 font-bold text-slate-800">৳ {item.amount}</td>
                                    <td className="p-4 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <StatusBadge status={item.status} />
                                    </td>

                                </tr>
                            ))}
                            {!loading && history.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        No transaction history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                    {history.map((item, idx) => (
                        <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-xs">#{idx + 1}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">৳ {item.amount}</div>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 text-xs uppercase font-bold">Trx ID</span>
                                    <span className="font-mono font-bold text-slate-700">{item.transactionId}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 text-xs uppercase font-bold">Order ID</span>
                                    <span className="font-mono font-bold text-blue-600">{item.orderId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 text-xs uppercase font-bold">Number</span>
                                    <span className="font-mono text-slate-600">{item.paymentNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && history.length === 0 && (
                        <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                            No transaction history found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PackageCard({ amount, bonus, onClick }: { amount: string, bonus: string, onClick: () => void }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-center hover:shadow-md transition">
            <div>
                <div className="text-xl font-bold text-slate-900">৳ {amount}</div>
                <div className="text-xs font-bold text-green-600">+ ৳ {bonus} Bonus</div>
            </div>
            <button onClick={onClick} className="w-full py-2 bg-[#e91e63] text-white text-sm font-bold rounded-md hover:bg-[#d81b60] transition">
                Recharge
            </button>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'APPROVED':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Approved</span>;
        case 'REJECTED':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Rejected</span>;
        default:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> Pending</span>;
    }
}
