'use client';

import { useState, useEffect } from 'react';
import {
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    PlayCircle,
    Download,
    Upload,
    ChevronDown
} from 'lucide-react';
import SuccessModal from '@/app/components/SuccessModal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
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
            } else {
                // No need to show success modal for delete usually, purely to reduce friction, but user asked for popups.
                // Let's show a small success modal or just rely on optimistic UI. 
                // User said "ami jokhon delete korte jabo tokhon amar kase popup show hobe" (When I go to delete, show popup).
                // That's the confirmation one. 
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
                // Optional: Show success toast/modal? User asked specifically for upload popup. 
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
        try {
            // 1. Upload to UploadThing First
            const utRes = await uploadFiles("pdfUploader", { files: [file] });
            const uploadedUrl = utRes?.[0]?.url;

            if (!uploadedUrl) {
                throw new Error("UploadThing failed to return URL");
            }

            // 2. Save URL to Database
            const formData = new FormData();
            formData.append('id', id);
            formData.append('status', currentStatus);
            formData.append('pdfPath', uploadedUrl); // Send the URL, not the file

            const res = await fetch('/api/admin/orders', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const updatedOrder = await res.json();
                setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
                setSuccessModal({
                    isOpen: true,
                    title: 'Upload Successful!',
                    message: 'The PDF file has been uploaded to Cloud Storage and attached.'
                });
            } else {
                setSuccessModal({ isOpen: true, title: 'Save Failed', message: 'File uploaded but could not be saved to order.' });
            }
        } catch (error) {
            console.error('Upload failed', error);
            setSuccessModal({ isOpen: true, title: 'Upload Failed', message: 'Could not upload to cloud storage.' });
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
                                    <th className="p-4 font-semibold">User</th>
                                    <th className="p-4 font-semibold">Request Details</th>
                                    <th className="p-4 font-semibold">Current Status</th>
                                    <th className="p-4 font-semibold">Service Fee</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold w-72">Manage Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition">
                                        <td className="p-4 align-top">
                                            {order.user ? (
                                                <>
                                                    <div className="font-bold text-slate-800">{order.user.name || 'No Name'}</div>
                                                    <div className="text-xs text-slate-500">{order.user.email}</div>
                                                </>
                                            ) : (
                                                <span className="text-slate-400 italic">Unknown User</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                <span className="font-mono">{order.nid}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                DOB: {new Date(order.dob).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            {order.pdfPath && (
                                                <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> File Attached
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm align-top">
                                            <div className="font-bold text-slate-700">
                                                {order.fee !== undefined ? `৳${order.fee}` : '-'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 align-top">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 align-top">
                                            <StatusManager
                                                order={order}
                                                onStatusChange={(newStatus) => handleStatusChangeRequest(order.id, newStatus)}
                                                onFileUpload={(file) => handleFileUpload(order.id, order.status, file)}
                                                onFileRemove={() => handleFileRemoveRequest(order.id)}
                                                onDelete={() => handleDeleteClick(order.id)}
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

                            {/* NID Section (Explicitly above details) */}
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
                                    <div className="font-medium text-slate-700">{new Date(order.dob).toLocaleDateString()}</div>
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
                                    onFileUpload={(file) => handleFileUpload(order.id, order.status, file)}
                                    onFileRemove={() => handleFileRemoveRequest(order.id)}
                                    onDelete={() => handleDeleteClick(order.id)}
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
        </div>
    );
}

// Updated StatusManager: Dumb Component using Callbacks
function StatusManager({
    order,
    onStatusChange,
    onFileUpload,
    onFileRemove,
    onDelete
}: {
    order: Order,
    onStatusChange: (status: string) => void,
    onFileUpload: (file: File) => void,
    onFileRemove: () => void,
    onDelete: () => void
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
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-sm flex items-center gap-2">
            {/* Status Select */}
            <div className="relative w-36 flex-shrink-0">
                <select
                    value={order.status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    disabled={order.status === 'CANCELLED'}
                    className={`w-full p-2 pl-3 pr-8 rounded-lg border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 font-medium cursor-pointer text-xs ${order.status === 'CANCELLED' ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* File Upload / Preview - Hidden if Cancelled */}
            {order.status !== 'CANCELLED' && (
                <div className="flex-1 min-w-0">
                    {order.pdfPath ? (
                        <div className="flex items-center gap-2">
                            <a
                                href={order.pdfPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition min-w-0 group"
                                title="View Attached File"
                            >
                                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-xs truncate font-medium">View File</span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onFileRemove();
                                    }}
                                    className="ml-auto p-0.5 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove File"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                </button>
                            </a>
                            <label className="cursor-pointer p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 transition" title="Replace File">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                                {uploading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            </label>
                        </div>
                    ) : (
                        <label className={`flex items-center justify-center gap-1.5 h-full px-2 py-1.5 rounded-lg border border-dashed transition cursor-pointer ${uploading ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-500'}`}>
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
                                    <span className="text-xs">Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-3.5 h-3.5" />
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
                className="p-2 rounded-lg bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition shadow-sm"
                title="Delete Order"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
