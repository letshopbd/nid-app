'use client';

import { useState, useEffect } from 'react';
import { Server, Save, RotateCcw } from 'lucide-react';
import SuccessModal from '@/app/components/SuccessModal';

interface Service {
    id: string;
    name: string;
    status: string;
    link: string;
    fee?: number;
}

export default function ServiceFeePage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });

    // Initial list of services
    const knownServices = [
        { name: 'Sign Copy to NID', link: '/dashboard/services/sign-copy', fee: 0 },
        { name: 'Make Birth Reg', link: '#', fee: 0 },
        { name: 'Server Copy Unofficial', link: '/dashboard/services/nid', fee: 20 },
        { name: 'Sign to Server Copy', link: '/dashboard/services/sign-to-server', fee: 0 },
        { name: 'Tin Certificate', link: '/dashboard/services/tin-certificate', fee: 0 },
    ];

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/services/status');
            const data = await res.json();

            // Merge known services with DB data
            const merged = knownServices.map(known => {
                const existing = data.find((d: Service) => d.name === known.name);
                return existing || { ...known, id: '', status: 'Active' };
            });

            setServices(merged);
        } catch (error) {
            console.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        if (!id) {
            // For static/known services that are not in DB yet, we can't toggle status easily without creating them first.
            // But for now, let's assume they should exist or direct user to "Update" fee first which creates them.
            alert('Please "Update" the service fee at least once to create the record in database before toggling status.');
            return;
        }
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

        // Optimistic
        setServices(services.map(s => s.id === id ? { ...s, status: newStatus } : s));

        try {
            await fetch('/api/services', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
        } catch (error) {
            console.error('Failed to update status');
            fetchServices(); // Revert
        }
    };

    const handleUpdate = async (service: Service) => {
        console.log('Updating service:', service);
        try {
            const payload = {
                id: service.id, // Include ID for direct update
                name: service.name,
                fee: Number(service.fee),
                status: service.status
            };
            console.log('Payload:', payload);

            const res = await fetch('/api/services/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updated = await res.json();
                console.log('Update success:', updated);
                setServices(prev => prev.map(s => s.name === updated.name ? updated : s));
                setSuccessModal({
                    isOpen: true,
                    message: `Service fee for "${service.name}" updated successfully.`
                });
            } else {
                const err = await res.json();
                console.error('Update failed:', err);
                alert(`Failed to update: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to update fee', error);
            alert('Something went wrong during update.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Service Control</h2>
                        <p className="text-sm text-slate-500">Set service fees and update usage credits</p>
                    </div>
                    <button
                        onClick={fetchServices}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                        title="Refresh"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-sm">
                                <th className="pb-3 font-semibold pl-4">Service Name</th>
                                <th className="pb-3 font-semibold text-center">Status</th>
                                <th className="pb-3 font-semibold">Service Fee (৳)</th>
                                <th className="pb-3 font-semibold text-right pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {services.map((service, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <Server className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-slate-700">{service.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={service.status === 'Active'}
                                                onChange={() => handleStatusToggle(service.id, service.status)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </td>
                                    <td className="py-4">
                                        <div className="relative max-w-[140px]">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">৳</span>
                                            <input
                                                type="number"
                                                className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition font-semibold text-slate-700"
                                                value={service.fee || 0}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                    setServices(services.map(s => s.name === service.name ? { ...s, fee: isNaN(val) ? 0 : val } : s));
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4 text-right">
                                        <button
                                            onClick={() => handleUpdate(service)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200"
                                        >
                                            <Save className="w-4 h-4" /> Update
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title="Success"
                message={successModal.message}
            />
        </div>
    );
}
