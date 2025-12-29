'use client';

import { useState, useEffect } from 'react';
import {
    Trash2,
    CheckCircle,
    XCircle,
    FileText,
    PlayCircle,
    Download,
    Upload,
    ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import SuccessModal from '@/app/components/SuccessModal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import VerificationModal from '@/app/components/VerificationModal';
import { uploadFiles } from '@/app/utils/uploadthing';

interface Order {
    id: string;
    nid: string;
    dob: string;
    status: string;
    createdAt: string;
    pdfPath?: string;
    phone?: string;
    transactionId?: string;
    fee?: number;
    user: {
        name: string | null;
        email: string;
        username: string | null;
    } | null;
}

const formatDateISO = (dateString: string) => {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger' as 'danger' | 'info',
        confirmText: '',
        onConfirm: () => { }
    });

    // Verification Modal State
    const [verificationState, setVerificationState] = useState({
        isOpen: false,
        orderId: '',
        captchaImage: null as string | null,
        cookies: null as any,
        sessionId: null as string | null, // Added Session ID
        status: 'IDLE', // 'IDLE' | 'FETCHING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'
        error: undefined as string | undefined
    });

    const fetchOrders = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch('/api/admin/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to load orders');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(true);
        const interval = setInterval(() => fetchOrders(false), 5000);
        return () => clearInterval(interval);
    }, []);

    // --- Action Handlers ---

    const handleDeleteClick = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Order?',
            message: 'Are you sure you want to delete this order? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Yes, Delete',
            onConfirm: () => executeDelete(id)
        });
    };

    const executeDelete = async (id: string) => {
        setOrders(orders.filter(o => o.id !== id)); // Optimistic UI
        try {
            const res = await fetch(`/api/admin/orders?id=${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                fetchOrders(); // Revert if failed
                setSuccessModal({ isOpen: true, title: 'Error', message: 'Failed to delete order.' });
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            fetchOrders();
        }
    };

    const handleStatusChangeRequest = (id: string, newStatus: string) => {
        if (newStatus === 'CANCELLED') {
            const order = orders.find(o => o.id === id);
            const feeToRefund = order?.fee || 20;

            setConfirmModal({
                isOpen: true,
                title: 'Cancel Order?',
                message: `Are you sure you want to cancel this order? This will refund the user's balance (${feeToRefund} BDT). This action cannot be undone.`,
                type: 'danger',
                confirmText: 'Yes, Cancel Order',
                onConfirm: () => executeStatusUpdate(id, newStatus)
            });
        } else {
            executeStatusUpdate(id, newStatus);
        }
    };

    const executeStatusUpdate = async (id: string, newStatus: string) => {
        // Optimistic Update
        const previousOrders = [...orders];
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));

        const formData = new FormData();
        formData.append('id', id);
        formData.append('status', newStatus);

        try {
            const res = await fetch('/api/admin/orders', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const updatedOrder = await res.json();
                setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
            } else {
                setOrders(previousOrders); // Revert
                setSuccessModal({ isOpen: true, title: 'Error', message: 'Failed to update status.' });
            }
        } catch (error) {
            console.error('Update failed', error);
            setOrders(previousOrders);
        }
    };

    const handleFileUpload = async (id: string, currentStatus: string, file: File) => {
        // 1. Upload to UploadThing First
        const utRes = await uploadFiles("pdfUploader", { files: [file] });
        const uploadedUrl = utRes?.[0]?.url;

        if (!uploadedUrl) {
            throw new Error("UploadThing failed to return URL (Check console/network)");
        }

        // 2. Save URL to Database
        const formData = new FormData();
        formData.append('id', id);
        formData.append('status', currentStatus);
        formData.append('pdfPath', uploadedUrl);

        const res = await fetch('/api/admin/orders', {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            const updatedOrder = await res.json();
            setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
            return true;
        } else {
            throw new Error('Database update failed after upload.');
        }
    };

    const handleManualFileUpload = async (id: string, currentStatus: string, file: File) => {
        try {
            await handleFileUpload(id, currentStatus, file);
            setSuccessModal({
                isOpen: true,
                title: 'Upload Successful!',
                message: 'The PDF file has been uploaded to Cloud Storage and attached.'
            });
        } catch (error: any) {
            console.error('Manual Upload failed', error);
            setSuccessModal({
                isOpen: true,
                title: 'Upload Failed',
                message: error.message || 'Could not upload to cloud storage.'
            });
        }
    };

    const handleFileRemoveRequest = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove File?',
            message: 'Are you sure you want to remove the attached file? The order status will revert to "Processing".',
            type: 'danger',
            confirmText: 'Yes, Remove File',
            onConfirm: () => executeFileRemove(id)
        });
    };

    const executeFileRemove = async (id: string) => {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('status', 'PROCESSING');
        formData.append('removeFile', 'true');

        try {
            const res = await fetch('/api/admin/orders', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const updatedOrder = await res.json();
                setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
                setSuccessModal({
                    isOpen: true,
                    title: 'File Removed',
                    message: 'The file has been removed and order status reverted to Processing.'
                });
            } else {
                setSuccessModal({ isOpen: true, title: 'Error', message: 'Failed to remove file.' });
            }
        } catch (error) {
            console.error('File remove failed', error);
            setSuccessModal({ isOpen: true, title: 'Error', message: 'An unexpected error occurred.' });
        }
    };

    // --- AUTO VERIFICATION ---
    const handleAutoVerify = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        setVerificationState({
            isOpen: true,
            orderId,
            captchaImage: null,
            cookies: null,
            sessionId: null,
            status: 'FETCHING',
            error: undefined
        });

        try {
            const res = await fetch('/api/admin/verify-birth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'FETCH_CAPTCHA',
                    nid: order.nid,
                    dob: formatDateISO(order.dob)
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setVerificationState(prev => ({
                        ...prev,
                        captchaImage: data.captchaImage,
                        cookies: data.cookies,
                        sessionId: data.sessionToken, // Store Session Token
                        status: 'IDLE' // Ready for input
                    }));
                } else {
                    throw new Error(data.error || 'Failed to load captcha');
                }
            } else {
                const errorInfo = await res.json().catch(() => ({}));
                throw new Error(errorInfo.error || 'Failed to connect to verification server');
            }
        } catch (e: any) {
            setVerificationState(prev => ({ ...prev, status: 'ERROR', error: e.message }));
        }
    };

    const executeVerification = async (answer: string) => {
        const { orderId, cookies, sessionId } = verificationState;
        const order = orders.find(o => o.id === orderId);

        if (!order) return;

        setVerificationState(prev => ({ ...prev, status: 'VERIFYING', error: undefined }));

        try {
            // 1. Verify and Get PDF
            const res = await fetch('/api/admin/verify-birth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'VERIFY',
                    nid: order.nid,
                    dob: formatDateISO(order.dob),
                    captchaAnswer: answer,
                    cookies: cookies,
                    sessionToken: sessionId // Send Session Token back to server
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success || !data.pdfBase64) {
                throw new Error(data.error || 'Verification Failed. Check Answer.');
            }

            // 2. Convert Base64 to File (Robust)
            const cleanBase64 = data.pdfBase64.replace(/[^A-Za-z0-9+/=]/g, ""); // Remove any non-base64 chars

            let byteCharacters;
            try {
                byteCharacters = atob(cleanBase64);
            } catch (atobError) {
                console.error('atob failed. Base64 length:', cleanBase64.length, 'Sample:', cleanBase64.substring(0, 50));
                throw new Error('Failed to decode PDF file from server.');
            }
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            // Create a file with a unique name
            const fileName = `BirthVerify_${order.nid}_${Date.now()}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });

            if (file.size === 0) {
                throw new Error('Generated PDF is empty (0 bytes).');
            }

            // 3. Upload File
            const uploadSuccess = await handleFileUpload(orderId, 'COMPLETED', file);

            if (uploadSuccess) {
                setVerificationState(prev => ({ ...prev, status: 'SUCCESS' }));
            } else {
                throw new Error('Upload to Cloud Storage failed. Check console for details.');
            }

        } catch (e: any) {
            console.error('Auto Verify Error:', e);

            // Auto Cancel if No Record Found
            if (e.message && e.message.includes('No Record Found')) {
                toast.error('No Record Found. Auto-cancelling order...');
                try {
                    await executeStatusUpdate(orderId, 'CANCELLED');
                    setVerificationState(prev => ({ ...prev, status: 'ERROR', error: 'Order Auto-Cancelled (No Record)' }));
                    return;
                } catch (cancelErr) {
                    console.error('Failed to auto-cancel:', cancelErr);
                }
            }

            setVerificationState(prev => ({ ...prev, status: 'ERROR', error: e.message }));
        }
    };


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'PROCESSING': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'PAID': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Orders Management</h2>
                        <p className="text-sm text-slate-500">Track and manage customer requests</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-bold">
                        Total Orders: {orders.length}
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading orders...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500 text-sm uppercase bg-slate-50">
                                    <th className="px-2 py-3 font-semibold text-xs tracking-wider">User</th>
                                    <th className="px-2 py-3 font-semibold text-xs tracking-wider">Request Details</th>
                                    <th className="px-2 py-3 font-semibold text-xs tracking-wider">Current Status</th>
                                    <th className="px-2 py-3 font-semibold text-xs tracking-wider">Fee</th>
                                    <th className="px-2 py-3 font-semibold text-xs tracking-wider">Date</th>
                                    <th className="px-2 py-3 font-semibold text-xs tracking-wider">Manage Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition">
                                        <td className="px-2 py-3 align-top max-w-[140px]">
                                            {order.user ? (
                                                <>
                                                    <div className="font-bold text-slate-800 text-sm truncate" title={order.user.name || ''}>{order.user.name || 'No Name'}</div>
                                                    <div className="text-xs text-slate-500 truncate" title={order.user.email}>{order.user.email}</div>
                                                </>
                                            ) : (
                                                <span className="text-slate-400 italic text-sm">Unknown User</span>
                                            )}
                                        </td>
                                        <td className="px-2 py-3 align-top">
                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                <span className="font-mono text-xs font-bold">{order.nid}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                DOB: {formatDateISO(order.dob)}
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 align-top">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            {order.pdfPath && (
                                                <div className="mt-1 text-[10px] text-green-600 font-medium flex items-center gap-1 whitespace-nowrap">
                                                    <CheckCircle className="w-3 h-3" /> Attached
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 py-3 text-sm align-top">
                                            <div className="font-bold text-slate-700">
                                                {order.fee !== undefined ? `৳${order.fee}` : '-'}
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 text-xs text-slate-500 align-top whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-2 py-3 align-top">
                                            <StatusManager
                                                order={order}
                                                onStatusChange={(newStatus) => handleStatusChangeRequest(order.id, newStatus)}
                                                onFileUpload={(file) => handleManualFileUpload(order.id, order.status, file)}
                                                onFileRemove={() => handleFileRemoveRequest(order.id)}
                                                onDelete={() => handleDeleteClick(order.id)}
                                                onAutoVerify={() => handleAutoVerify(order.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">Orders</h2>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-bold">
                        {orders.length} Total
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading orders...</div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                            {/* Header: ID and User */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">
                                        {order.user?.name || 'Unknown User'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {order.user?.email}
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>

                            {/* NID Section */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-bold uppercase">NID Number</span>
                                <div className="flex items-center gap-2 font-mono font-bold text-slate-800 text-lg">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    {order.nid}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-400">DOB</div>
                                    <div className="font-medium text-slate-700">{formatDateISO(order.dob)}</div>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-400">Fee</div>
                                    <div className="font-bold text-slate-700">{order.fee !== undefined ? `৳${order.fee}` : '-'}</div>
                                </div>
                            </div>

                            {/* Status Manager (Full Width) */}
                            <div className="pt-2 border-t border-slate-100">
                                <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Manage Order</div>
                                <StatusManager
                                    order={order}
                                    onStatusChange={(newStatus) => handleStatusChangeRequest(order.id, newStatus)}
                                    onFileUpload={(file) => handleManualFileUpload(order.id, order.status, file)}
                                    onFileRemove={() => handleFileRemoveRequest(order.id)}
                                    onDelete={() => handleDeleteClick(order.id)}
                                    onAutoVerify={() => handleAutoVerify(order.id)}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Global Modals */}
            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title={successModal.title}
                message={successModal.message}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
            />

            <VerificationModal
                isOpen={verificationState.isOpen}
                onClose={() => setVerificationState(prev => ({ ...prev, isOpen: false }))}
                captchaImage={verificationState.captchaImage}
                loading={verificationState.status === 'FETCHING' || verificationState.status === 'VERIFYING'}
                onSubmit={executeVerification}
                status={verificationState.status}
                error={verificationState.error}
            />
        </div>
    );
}

// Updated StatusManager: Dumb Component using Callbacks
function StatusManager({
    order,
    onStatusChange,
    onFileUpload,
    onFileRemove,
    onDelete,
    onAutoVerify
}: {
    order: Order,
    onStatusChange: (status: string) => void,
    onFileUpload: (file: File) => void,
    onFileRemove: () => void,
    onDelete: () => void,
    onAutoVerify: () => void
}) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setUploading(true);
            await onFileUpload(e.target.files[0]);
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full max-w-sm">
            {/* Main Controls */}
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-sm flex flex-col xl:flex-row xl:items-center gap-2 w-full">
                {/* Status Select */}
                <div className="relative w-full xl:w-32 flex-shrink-0">
                    <select
                        value={order.status}
                        onChange={(e) => onStatusChange(e.target.value)}
                        disabled={order.status === 'CANCELLED'}
                        className={`w-full p-1.5 pl-2 pr-6 rounded bg-white border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-200 ${order.status === 'CANCELLED' ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                    >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                {/* File Actions */}
                <div className="flex items-center gap-1 w-full xl:w-auto flex-1">
                    {order.status !== 'CANCELLED' && (
                        <div className="flex-1 min-w-0">
                            {order.pdfPath ? (
                                <div className="flex items-center gap-1">
                                    <a
                                        href={order.pdfPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-50 border border-green-200 rounded text-green-700 hover:bg-green-100 transition min-w-0"
                                        title="View Attached File"
                                    >
                                        <FileText className="w-3 h-3 flex-shrink-0" />
                                        <span className="text-xs truncate font-medium">View</span>
                                    </a>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onFileRemove();
                                        }}
                                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded border border-red-100 transition"
                                        title="Remove File"
                                    >
                                        <XCircle className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <label className={`flex items-center justify-center gap-1.5 w-full h-full px-2 py-1.5 rounded border border-dashed transition cursor-pointer ${uploading ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-500'}`}>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <>
                                            <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                                            <span className="text-[10px]">Loading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-3 h-3" />
                                            <span className="text-xs">Upload</span>
                                        </>
                                    )}
                                </label>
                            )}
                        </div>
                    )}

                    {/* Delete Button */}
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition shadow-sm ml-auto xl:ml-0"
                        title="Delete Order"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Auto Verify Button - New Feature */}
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && !order.pdfPath && (
                <button
                    onClick={onAutoVerify}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                >
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                        <PlayCircle className="w-2.5 h-2.5" />
                    </div>
                    Auto Verify & Attach
                </button>
            )}
        </div>
    );
}
