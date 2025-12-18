'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, ArrowRight, Server, Shield, XCircle, Database } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    const [storageStats, setStorageStats] = useState({
        totalSize: '0 MB',
        fileUsage: '0 MB'
    });

    useEffect(() => {
        const fetchStats = async (showLoading = true) => {
            if (showLoading) setLoading(true);
            try {
                const [usersRes, ordersRes, storageRes] = await Promise.all([
                    fetch(`/api/admin/users?t=${Date.now()}`),
                    fetch(`/api/admin/orders?t=${Date.now()}`),
                    fetch(`/api/admin/stats/storage?t=${Date.now()}`)
                ]);

                if (usersRes.ok && ordersRes.ok) {
                    const users = await usersRes.json();
                    const orders = await ordersRes.json();

                    // Calculate stats
                    const totalOrders = orders.length;
                    const pendingOrders = orders.filter((o: any) => o.status === 'PENDING' || o.status === 'PROCESSING').length;
                    const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED').length;
                    const totalRevenue = orders.reduce((sum: number, order: any) => {
                        return order.status === 'CANCELLED' ? sum : sum + (order.fee || 0);
                    }, 0);

                    setStats({
                        totalOrders,
                        pendingOrders,
                        cancelledOrders,
                        totalRevenue
                    });
                }

                if (storageRes.ok) {
                    const storageData = await storageRes.json();
                    setStorageStats({
                        totalSize: storageData.totalSize,
                        fileUsage: storageData.fileUsage
                    });
                }
            } catch (error) {
                console.error('Failed to load stats', error);
            } finally {
                if (showLoading) setLoading(false);
            }
        };

        fetchStats(true);
        const interval = setInterval(() => fetchStats(false), 5000);

        return () => clearInterval(interval);
    }, []);

    const cards = [
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: FileText,
            color: 'bg-blue-500',
            bg: 'bg-blue-50',
            text: 'text-blue-600'
        },
        {
            title: 'Pending Orders',
            value: stats.pendingOrders,
            icon: Server,
            color: 'bg-orange-500',
            bg: 'bg-orange-50',
            text: 'text-orange-600'
        },
        {
            title: 'Cancelled Orders',
            value: stats.cancelledOrders,
            icon: XCircle,
            color: 'bg-red-500',
            bg: 'bg-red-50',
            text: 'text-red-600'
        },
        {
            title: 'Total Revenue',
            value: `৳${stats.totalRevenue}`,
            icon: TrendingUp,
            color: 'bg-green-500',
            bg: 'bg-green-50',
            text: 'text-green-600'
        },
        {
            title: 'DB Storage',
            value: storageStats.totalSize,
            desc: `Files: ${storageStats.fileUsage}`,
            icon: Database,
            color: 'bg-purple-500',
            bg: 'bg-purple-50',
            text: 'text-purple-600'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Unique Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Welcome Back, Admin!</h2>
                    <p className="text-blue-100 opacity-90 max-w-xl">
                        Here's what's happening on your platform today. You have {stats.pendingOrders} pending orders requiring attention.
                    </p>
                    <div className="mt-6 flex gap-3">
                        <Link
                            href="/admin/orders"
                            className="px-5 py-2.5 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition shadow-sm"
                        >
                            Manage Orders
                        </Link>
                        <Link
                            href="/admin/service-fee"
                            className="px-5 py-2.5 bg-blue-700/50 text-white border border-white/20 rounded-lg font-bold text-sm hover:bg-blue-700/70 transition backdrop-blur-sm"
                        >
                            Service Control
                        </Link>
                    </div>
                </div>

                {/* Decorative Background */}
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
                    <Shield className="w-full h-full transform translate-x-12 -translate-y-6" />
                </div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${card.bg} p-3 rounded-lg`}>
                                <card.icon className={`w-6 h-6 ${card.text}`} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-slate-500 text-sm font-medium mb-1">{card.title}</h3>
                            {loading ? (
                                <div className="h-8 w-24 bg-slate-100 rounded animate-pulse"></div>
                            ) : (
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                                    {/* @ts-ignore */}
                                    {card.desc && <p className="text-xs text-slate-400 font-medium mt-1">{card.desc}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 text-lg">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/admin/users" className="group p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-200 transition">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">Manage Users</h4>
                                <p className="text-xs text-slate-500">View and manage accounts</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
                    </Link>

                    <Link href="/admin/service-fee" className="group p-4 rounded-xl border border-slate-100 hover:border-green-200 hover:bg-green-50/50 transition flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-200 transition">
                                <Server className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">Service Control</h4>
                                <p className="text-xs text-slate-500">Adjust fees & status</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition" />
                    </Link>

                    <Link href="/admin/orders" className="group p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600 group-hover:bg-purple-200 transition">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">Recent Orders</h4>
                                <p className="text-xs text-slate-500">Process pending requests</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
