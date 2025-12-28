'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceGuardProps {
    serviceName: string;
    children: React.ReactNode;
}

export default function ServiceGuard({ serviceName, children }: ServiceGuardProps) {
    const [isActive, setIsActive] = useState<boolean | null>(null); // null = loading

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/services/status?name=${encodeURIComponent(serviceName)}`);
                if (res.ok) {
                    const data = await res.json();
                    setIsActive(data.status === 'Active');
                } else {
                    // Fallback: Assume active if check fails to avoid blocking users unnecessarily, or inactive for safety. 
                    // Let's assume Inactive for safety if API fails explicitly, or Active if just network glitch?
                    // Better saftey: Inactive.
                    setIsActive(false);
                }
            } catch (error) {
                console.error('Service status check failed');
                setIsActive(false);
            }
        };

        checkStatus();
    }, [serviceName]);

    if (isActive === null) {
        // Loading state - maybe just render children with slight opacity or a spinner?
        // Let's render children to avoid layout shift, but with a loader overlay.
        return (
            <div className="relative min-h-screen">
                <div className="opacity-50 pointer-events-none" aria-hidden="true">
                    {children}
                </div>
                <div className="absolute inset-0 z-50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!isActive) {
        // Mapping for Bengali Service Names
        const englishNamesMap: Record<string, string> = {
            'Sign Copy to NID': 'Sign Copy to NID',
            'Birth Registration': 'Birth Registration',
            'Make Birth Reg': 'Birth Registration',
            'Server Copy Unofficial': 'Server Copy (Unofficial)',
            'Sign to Server Copy': 'Sign to Server Copy',
            'Tin Certificate': 'Tin Certificate'
        };
        const displayName = englishNamesMap[serviceName] || serviceName;

        return (
            <div className="relative min-h-screen overflow-hidden">
                {/* Blurred Content */}
                <div className="blur-md pointer-events-none select-none opacity-50 grayscale" aria-hidden="true">
                    {children}
                </div>

                {/* Maintenance Overlay */}
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-24 p-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-red-500/10 pointer-events-none" />

                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white">
                            <Lock className="w-10 h-10" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Service Currently Unavailable</h2>
                        <h3 className="text-lg font-medium text-amber-600 mb-4">{displayName}</h3>

                        <p className="text-slate-600 mb-8 leading-relaxed">
                            This service is currently unavailable due to maintenance or administrative reasons.
                            <br />
                            <span className="text-sm text-slate-400 mt-2 block">Please try again later.</span>
                        </p>

                        <button
                            onClick={() => window.history.back()}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg w-full"
                        >
                            Go Back
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
