'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, ArrowRight, Server, Shield, XCircle, Database, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        totalUsers: 0
    });
    const [loading, setLoading] = useState(true);

    const [storageStats, setStorageStats] = useState<{
        totalSize: string;
        fileUsage: string;
        cloud?: {
            usedBytes: number;
            limitBytes: number;
            fileCount: number;
            usageFormatted: string;
            limitFormatted: string;
            percentage: string;
        }
    }>({
        totalSize: '0 MB',
        fileUsage: '0 MB',
        cloud: undefined
    });

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
                const totalUsers = users.length;
                const pendingOrders = orders.filter((o: any) => o.status === 'PENDING' || o.status === 'PROCESSING').length;
                const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED').length;
                const totalRevenue = orders.reduce((sum: number, order: any) => {
                    return order.status === 'CANCELLED' ? sum : sum + (order.fee || 0);
                }, 0);

                setStats({
                    totalOrders,
                    pendingOrders,
                    cancelledOrders,
                    totalRevenue,
                    totalUsers
                });
            }

            if (storageRes.ok) {
                const storageData = await storageRes.json();
                setStorageStats({
                    totalSize: storageData.totalSize,
                    fileUsage: storageData.fileUsage,
                    cloud: storageData.cloud
                });
            }
        } catch (error) {
            console.error('Failed to load stats', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(true);
        const interval = setInterval(() => fetchStats(false), 5000);

        return () => clearInterval(interval);
    }, []);

    const cards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'bg-indigo-500',
            bg: 'bg-indigo-50',
            text: 'text-indigo-600'
        },
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

    ];

    return (
        <div className="space-y-8">
            {/* Cloud Storage Dashboard Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/20">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                                    Cloud Storage Status
                                    {loading && <div className="w-2 h-2 rounded-full bg-white animate-ping" />}
                                </h2>
                                <p className="text-blue-100 opacity-90 text-sm">UploadThing Secure Storage</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fetchStats(true)}
                                    className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/20 transition group"
                                    title="Refresh Stats"
                                >
                                    <RefreshCw className={`w-5 h-5 text-white transition duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                                </button>
                                <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm border border-white/10">
                                    <Database className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Storage Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-4xl font-bold text-white tracking-tight">
                                    {/* @ts-ignore */}
                                    {storageStats.cloud?.usageFormatted || '0 MB'}
                                </span>
                                <span className="text-blue-100 opacity-80 font-medium mb-1">
                                    {/* @ts-ignore */}
                                    / {storageStats.cloud?.limitFormatted || '2 GB'}
                                </span>
                            </div>

                            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                                <div
                                    className="bg-white h-full rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    style={{ width: `${/* @ts-ignore */ storageStats.cloud?.percentage || 0}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-2 text-xs font-medium text-blue-100">
                                <span>
                                    {/* @ts-ignore */ storageStats.cloud?.percentage || 0}% Used
                                </span>
                                <span className="opacity-80">
                                    Total Capacity
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats Grid within Card */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-md hover:bg-white/15 transition duration-300">
                                <div className="text-blue-100 text-xs mb-1 uppercase tracking-wider font-bold opacity-80">Total Files</div>
                                <div className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-300" />
                                    {/* @ts-ignore */ storageStats.cloud?.fileCount || 0}
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-md hover:bg-white/15 transition duration-300">
                                <div className="text-blue-100 text-xs mb-1 uppercase tracking-wider font-bold opacity-80">Plan Status</div>
                                <div className="text-xl font-bold text-emerald-300 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Active
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Background Elements */}
                    <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
                        <Shield className="w-full h-full transform translate-x-20 -translate-y-10 rotate-12" />
                    </div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Right Side - Quick Actions (Moved up) */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-center">
                        <h3 className="font-bold text-slate-800 mb-4">Quick Management</h3>
                        <div className="space-y-3">
                            <Link href="/admin/orders" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition group">
                                <span className="text-sm font-medium">Manage Orders</span>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                            </Link>
                            <Link href="/admin/recharge-requests" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition group">
                                <span className="text-sm font-medium">Recharge Requests</span>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                            </Link>
                            <Link href="/admin/service-fee" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:text-purple-600 transition group">
                                <span className="text-sm font-medium">Service Fees</span>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500" />
                            </Link>
                        </div>
                    </div>
                </div>
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


        </div>
    );
}
