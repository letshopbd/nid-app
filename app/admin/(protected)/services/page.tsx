'use client';

import { useState, useEffect } from 'react';
import { Power, Activity, Server, ShieldAlert } from 'lucide-react';
import SuccessModal from '@/app/components/SuccessModal';

interface Service {
    id: string;
    name: string;
    status: string;
    link: string;
    fee?: number;
}

export default function ServicesControlPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });

    // Initial list of services to ensure they exist in DB
    const knownServices = [
        { name: 'Sign Copy to NID', link: '/dashboard/services/sign-copy', fee: 0 },
        { name: 'Birth Registration', link: '/dashboard/services/birth-registration', fee: 0 },
        { name: 'Server Copy Unofficial', link: '/dashboard/services/nid', fee: 20 },
        { name: 'Sign to Server Copy', link: '/dashboard/services/sign-to-server', fee: 0 },
        { name: 'Tin Certificate', link: '/dashboard/services/tin-certificate', fee: 0 },
    ];

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/services/status');
            const data = await res.json();

            // Merge known services with DB data (if DB is empty initially)
            const merged = knownServices.map(known => {
                const existing = data.find((d: Service) => d.name === known.name);
                return existing || { ...known, id: '', status: 'Active' }; // Default optimistic
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

    const toggleService = async (service: Service) => {
        const newStatus = service.status === 'Active' ? 'Inactive' : 'Active';

        // Optimistic UI
        setServices(services.map(s => s.name === service.name ? { ...s, status: newStatus } : s));

        try {
            const res = await fetch('/api/services/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: service.name, status: newStatus }),
            });

            if (res.ok) {
                const updated = await res.json();
                // Update with real ID from DB if it was a new creation
                setServices(prev => prev.map(s => s.name === updated.name ? updated : s));
                setSuccessModal({
                    isOpen: true,
                    message: `Service "${service.name}" is now ${newStatus}`
                });
            } else {
                fetchServices(); // Revert
            }
        } catch (error) {
            fetchServices();
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800">Service Control Panel</h2>
                        <p className="text-xs md:text-sm text-slate-500">Manage visibility and access to services</p>
                    </div>
                </div>

                <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service, index) => (
                        <div key={index} className={`relative flex flex-col justify-between rounded-xl border-2 transition-all duration-300 hover:shadow-lg overflow-hidden group ${service.status === 'Active' ? 'border-green-100 bg-white' : 'border-slate-100 bg-slate-50/50'}`}>

                            {/* Card Header & Status Toggle */}
                            <div className="p-4 md:p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl transition-colors ${service.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                            <Server className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-base md:text-lg leading-tight">{service.name}</h3>
                                            <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${service.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${service.status === 'Active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                                                {service.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Large Touch-Friendly Toggle */}
                                    <label className="relative inline-flex items-center cursor-pointer p-1 -mr-1">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={service.status === 'Active'}
                                            onChange={() => toggleService(service)}
                                        />
                                        <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 hover:bg-slate-300 transition-colors"></div>
                                    </label>
                                </div>

                                {/* Service Fee Input - Large & Accessible */}
                                <div className={`pt-4 border-t ${service.status === 'Active' ? 'border-green-50' : 'border-slate-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Service Fee</label>
                                        <div className="flex items-center relative w-1/2 max-w-[140px]">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">৳</div>
                                            <input
                                                type="number"
                                                className="w-full pl-8 pr-4 py-2 text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all focus:bg-white"
                                                placeholder="0"
                                                value={service.fee || 0}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setServices(services.map(s => s.name === service.name ? { ...s, fee: val } : s));
                                                }}
                                                onBlur={async (e) => {
                                                    const newFee = parseFloat(e.target.value);
                                                    try {
                                                        await fetch('/api/services/status', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ name: service.name, fee: newFee }),
                                                        });
                                                    } catch (err) {
                                                        console.error('Failed to update fee');
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title="Status Updated"
                message={successModal.message}
            />
        </div>
    );
}
