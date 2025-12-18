'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';

interface SuspendedViewProps {
    whatsappNumber?: string;
}

export default function SuspendedView({ whatsappNumber = '+8801700000000' }: SuspendedViewProps) {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="bg-orange-50 rounded-3xl p-10 max-w-md w-full text-center shadow-sm border border-orange-100">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                    <Lock className="w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">Service Unavailable</h1>
                <h2 className="text-lg font-bold text-orange-600 mb-6">Account Suspended</h2>

                <p className="text-slate-500 mb-8 leading-relaxed">
                    This service is currently under maintenance or has been temporarily disabled by the administration.
                    <br />
                    Please check back later or contact support.
                </p>

                <Link
                    href={`https://wa.me/${whatsappNumber.replace(/[^\d+]/g, '')}`}
                    target="_blank"
                    className="block w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition transform hover:scale-[1.02] shadow-lg shadow-slate-900/20"
                >
                    Contact Support
                </Link>
            </div>
        </div>
    );
}
