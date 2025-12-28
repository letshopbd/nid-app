'use client';

import React from 'react';

import { AlertTriangle, Hammer, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceScreenProps {
    mode: 'DOWN' | 'DEV';
    startTime?: string | null;
}

export default function MaintenanceScreen({ mode, startTime }: MaintenanceScreenProps) {
    const [duration, setDuration] = React.useState<string>('');

    React.useEffect(() => {
        if (!startTime) return;

        const updateTimer = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            const diff = now - start;

            if (diff < 0) {
                setDuration('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setDuration(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    // Poll for status change to auto-reload when back ON
    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/system/status');
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'ON') {
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error('Failed to check system status');
            }
        };

        const interval = setInterval(checkStatus, 3000); // Check every 3 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full">
                <div className="flex justify-center mb-6">
                    {mode === 'DOWN' ? (
                        <div className="p-4 bg-orange-100 text-orange-600 rounded-full animate-pulse">
                            <Hammer className="w-12 h-12" />
                        </div>
                    ) : (
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-full animate-pulse">
                            <RefreshCcw className="w-12 h-12" />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    {mode === 'DOWN' ? 'System Under Maintenance' : 'Development Mode'}
                </h1>

                <p className="text-slate-500 mb-8 leading-relaxed">
                    {mode === 'DOWN'
                        ? 'We are currently performing scheduled maintenance to improve our services. Please check back shortly.'
                        : 'The server is now in Development Mode. The team is currently adding features, fixing bugs, or updating the system.'}
                </p>

                {/* Duration Timer - Replaces Buttons */}
                <div className="bg-slate-900 text-white rounded-xl p-4 shadow-lg shadow-slate-200">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                        Time Elapsed
                    </p>
                    <div className="font-mono text-3xl font-bold tracking-wider">
                        {duration || '00:00:00'}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-slate-400 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>NID Service Portal &bull; System Protection Active</span>
            </div>
        </div>
    );
}
