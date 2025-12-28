'use client';

import { useState, useEffect } from 'react';
import { Trash2, Ban, CheckCircle, Shield, MoreVertical } from 'lucide-react';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
    balance: number;
    createdAt: string;
    password?: string; // Hashed
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to load users');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(true);
        const interval = setInterval(() => fetchUsers(false), 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStatusChange = async (id: string, currentStatus: string) => {
        const action = currentStatus === 'SUSPENDED' ? 'activate' : 'suspend';

        console.log(`Attempting to ${action} user ${id}...`);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action }),
            });

            console.log('Status update response:', res.status);

            if (res.ok) {
                console.log('Status update successful');
                fetchUsers();
            } else {
                const data = await res.json();
                console.error('Status update failed:', data);
                alert(`Failed to update status: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status. Check console for details.');
        }
    };

    const handleDelete = async (id: string) => {
        console.log(`Attempting to delete user ${id}...`);

        try {
            const res = await fetch(`/api/admin/users?id=${id}`, {
                method: 'DELETE',
            });

            console.log('Delete response:', res.status);

            if (res.ok) {
                console.log('Delete successful');
                setUsers(users.filter(u => u.id !== id));
            } else {
                const data = await res.json();
                console.error('Delete failed:', data);
                alert(`Failed to delete user: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user. Check console for details.');
        }
    };

    return (
        <div className="space-y-6">

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Users Management</h2>
                        <p className="text-sm text-slate-500">Manage registered users</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-bold">
                        Total Users: {users.length}
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading users...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500 text-sm uppercase bg-slate-50">
                                    <th className="p-4 font-semibold">User Info</th>
                                    <th className="p-4 font-semibold">Role & Status</th>
                                    <th className="p-4 font-semibold">Balance</th>
                                    <th className="p-4 font-semibold">Joined Date</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{user.name || 'No Name'}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                            {/* Showing hashed password truncated for visibility as requested */}
                                            <div className="text-[10px] text-slate-300 font-mono mt-1 w-32 truncate" title="Hashed Password">
                                                {user.password ? `${user.password.substring(0, 15)}...` : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {user.role === 'ADMIN' ? (
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-bold rounded flex items-center gap-1">
                                                        <Shield className="w-3 h-3" /> Admin
                                                    </span>
                                                ) : user.status === 'SUSPENDED' ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded flex items-center gap-1">
                                                        <Ban className="w-3 h-3" /> Suspended
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Active User
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-medium">
                                            ৳ {user.balance.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            {user.role !== 'ADMIN' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.status === 'SUSPENDED' ? (
                                                        <ActionBtn
                                                            onClick={() => handleStatusChange(user.id, user.status)}
                                                            icon={<CheckCircle className="w-4 h-4" />}
                                                            baseColor="text-green-600 hover:bg-green-50"
                                                            confirmColor="bg-green-600 text-white hover:bg-green-700"
                                                            title="Activate User"
                                                        />
                                                    ) : (
                                                        <ActionBtn
                                                            onClick={() => handleStatusChange(user.id, user.status || 'ACTIVE')}
                                                            icon={<Ban className="w-4 h-4" />}
                                                            baseColor="text-orange-500 hover:bg-orange-50"
                                                            confirmColor="bg-orange-500 text-white hover:bg-orange-600"
                                                            title="Suspend User"
                                                        />
                                                    )}

                                                    <ActionBtn
                                                        onClick={() => handleDelete(user.id)}
                                                        icon={<Trash2 className="w-4 h-4" />}
                                                        baseColor="text-red-500 hover:bg-red-50"
                                                        confirmColor="bg-red-500 text-white hover:bg-red-600"
                                                        title="Delete User"
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">Users</h2>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-bold">
                        {users.length} Total
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading users...</div>
                ) : (
                    users.map((user) => (
                        <div key={user.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-slate-800 text-lg">{user.name || 'No Name'}</div>
                                    <div className="text-sm text-slate-500">{user.email}</div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-mono font-bold text-slate-700">৳{user.balance.toFixed(2)}</span>
                                    <div className="text-[10px] text-slate-400 mt-1">Balance</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <div>
                                    {user.role === 'ADMIN' ? (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-bold rounded flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> Admin
                                        </span>
                                    ) : user.status === 'SUSPENDED' ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded flex items-center gap-1">
                                            <Ban className="w-3 h-3" /> Suspended
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Active User
                                        </span>
                                    )}
                                </div>

                                {user.role !== 'ADMIN' && (
                                    <div className="flex items-center gap-2">
                                        {user.status === 'SUSPENDED' ? (
                                            <ActionBtn
                                                onClick={() => handleStatusChange(user.id, user.status)}
                                                icon={<CheckCircle className="w-4 h-4" />}
                                                baseColor="text-green-600 hover:bg-green-50"
                                                confirmColor="bg-green-600 text-white hover:bg-green-700"
                                                title="Activate User"
                                            />
                                        ) : (
                                            <ActionBtn
                                                onClick={() => handleStatusChange(user.id, user.status || 'ACTIVE')}
                                                icon={<Ban className="w-4 h-4" />}
                                                baseColor="text-orange-500 hover:bg-orange-50"
                                                confirmColor="bg-orange-500 text-white hover:bg-orange-600"
                                                title="Suspend User"
                                            />
                                        )}

                                        <ActionBtn
                                            onClick={() => handleDelete(user.id)}
                                            icon={<Trash2 className="w-4 h-4" />}
                                            baseColor="text-red-500 hover:bg-red-50"
                                            confirmColor="bg-red-500 text-white hover:bg-red-600"
                                            title="Delete User"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ActionBtn({ onClick, icon, baseColor, confirmColor, title }: {
    onClick: () => void;
    icon: React.ReactNode;
    baseColor: string;
    confirmColor: string;
    title?: string;
}) {
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (confirming) {
            const timer = setTimeout(() => setConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [confirming]);

    if (confirming) {
        return (
            <button
                onClick={onClick}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${confirmColor}`}
                title="Click again to confirm"
            >
                Confirm?
            </button>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className={`p-2 rounded-lg transition ${baseColor}`}
            title={title}
        >
            {icon}
        </button>
    );
}
