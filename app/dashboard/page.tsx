'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Calendar, CreditCard, Clock, CheckCircle, XCircle, Server, TrendingUp } from 'lucide-react';

interface Service {
    name: string;
    status: string;
    link: string;
}

export default function DashboardPage() {
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    const [statsData, setStatsData] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0
    });

    const stats = [
        {
            title: 'Total Orders',
            value: statsData.totalOrders.toString(),
            sub: 'Lifetime requests',
            color: 'from-blue-600 to-indigo-600',
            icon: Database
        },
        {
            title: 'Pending Orders',
            value: statsData.pendingOrders.toString(),
            sub: 'In progress',
            color: 'from-orange-400 to-amber-500',
            icon: Server
        },
        {
            title: 'Cancelled Orders',
            value: statsData.cancelledOrders.toString(),
            sub: 'Failed/Rejected',
            color: 'from-red-500 to-rose-500',
            icon: XCircle
        },
        {
            title: 'Total Revenue',
            value: `৳${statsData.totalRevenue}`,
            sub: 'Total Spent',
            color: 'from-green-500 to-emerald-500',
            icon: TrendingUp
        },
    ];

    // Services to display
    const knownServices = [
        { name: 'Sign Copy to NID', link: '/dashboard/services/sign-copy' },
        { name: 'Make Birth Reg', link: '#' },
        { name: 'Server Copy Unofficial', link: '/dashboard/services/nid' },
        { name: 'Sign to Server Copy', link: '/dashboard/services/sign-to-server' },
        { name: 'Tin Certificate', link: '/dashboard/services/tin-certificate' },
    ];

    useEffect(() => {
        // Hydration fix for Date
        setCurrentDate(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
        }, 1000);

        // Fetch Services and Stats
        const fetchData = async (showLoading = true) => {
            if (showLoading) setLoading(true);
            try {
                // Fetch Services Status
                const resStatus = await fetch(`/api/services/status?t=${Date.now()}`);
                const serviceData = await resStatus.json();

                const merged = knownServices.map(known => {
                    const found = Array.isArray(serviceData) ? serviceData.find((d: any) => d.name === known.name) : null;
                    return {
                        ...known,
                        status: found ? found.status : 'Active'
                    };
                });
                setServices(merged);

                // Fetch Stats
                const resStats = await fetch(`/api/user/stats?t=${Date.now()}`);
                if (resStats.ok) {
                    const sData = await resStats.json();
                    setStatsData(sData);
                }

            } catch (err) {
                console.error("Failed to load dashboard data");
                setServices(knownServices.map(s => ({ ...s, status: 'Active' })));
            } finally {
                if (showLoading) setLoading(false);
            }
        };

        fetchData(true);
        const interval = setInterval(() => fetchData(false), 5000);

        return () => {
            clearInterval(timer);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
                <div className="hidden md:block text-right text-sm text-slate-500 leading-snug">
                    <p className="flex items-center gap-2 justify-end"><Calendar className="w-3 h-3" /> {currentDate}</p>
                    <p className="flex items-center gap-2 justify-end"><Clock className="w-3 h-3" /> {currentTime}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.title} className={`p-6 rounded-2xl shadow-lg bg-gradient-to-r ${stat.color} text-white relative overflow-hidden`}>
                        <stat.icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-medium opacity-90">{stat.title}</h3>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mb-1">{stat.value}</p>
                            <p className="text-xs opacity-75">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Database className="w-5 h-5 text-slate-400" />
                    <h2 className="font-bold text-slate-800">Service List <span className="text-sm font-normal text-slate-400">({loading ? '...' : services.length} Services)</span></h2>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading services...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {services.map((service) => (
                            <Link
                                key={service.name}
                                href={service.status === 'Active' ? service.link : '#'}
                                className={`block p-4 rounded-xl border transition hover:shadow-md
                  ${service.status === 'Active'
                                        ? 'border-slate-100 bg-white hover:border-blue-200 cursor-pointer'
                                        : 'border-red-100 bg-red-50/50 cursor-not-allowed opacity-75'}
                `}
                                onClick={(e) => {
                                    if (service.status !== 'Active' || service.link === '#') e.preventDefault();
                                }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-slate-700 text-sm truncate" title={service.name}>{service.name}</h3>
                                    {service.status === 'Active' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${service.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className={`text-xs font-bold ${service.status === 'Active' ? 'text-green-600' : 'text-red-500'}`}>
                                        {service.status === 'Active' ? 'Running' : 'Closed'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
