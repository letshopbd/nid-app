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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Service Control Panel</h2>
                        <p className="text-sm text-slate-500">Manage visibility and access to services</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service, index) => (
                        <div key={index} className={`relative flex flex-col justify-between p-0 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg overflow-hidden group ${service.status === 'Active' ? 'border-green-100 bg-white' : 'border-slate-100 bg-slate-50/50'}`}>

                            {/* Card Header & Status Toggle */}
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3.5 rounded-xl transition-colors ${service.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                        <Server className="w-6 h-6" />
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={service.status === 'Active'}
                                            onChange={() => toggleService(service)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>

                                <h3 className="font-bold text-slate-800 text-lg mb-1">{service.name}</h3>

                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`flex w-2.5 h-2.5 rounded-full ${service.status === 'Active' ? 'bg-green-500 shadow-sm shadow-green-300' : 'bg-slate-400'}`} />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${service.status === 'Active' ? 'text-green-600' : 'text-slate-500'}`}>
                                        {service.status}
                                    </span>
                                </div>
                            </div>

                            {/* Service Fee Section */}
                            <div className={`mt-2 p-4 border-t ${service.status === 'Active' ? 'bg-green-50/30 border-green-50' : 'bg-slate-100/50 border-slate-100'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Fee</span>
                                    <div className="flex items-center relative group/input">
                                        <span className="absolute left-3 text-slate-400 text-sm font-semibold group-focus-within/input:text-blue-500 transition-colors">৳</span>
                                        <input
                                            type="number"
                                            className="w-24 pl-8 pr-3 py-1.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
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
