'use client';

import { Calculator, Search } from 'lucide-react';

import ServiceGuard from '@/app/components/ServiceGuard';

export default function TinCertificatePage() {
    return (
        <ServiceGuard serviceName="Tin Certificate">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">TIN Certificate</h1>
                    <p className="text-sm text-slate-500">Create certificate with TIN information</p>
                </div>

                {/* Marquee Banner */}


                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Card Header (Purple Gradient) */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-6 text-white">
                        <h2 className="text-xl font-bold mb-1">Search Information</h2>
                        <p className="text-purple-100 text-sm">Find information using TIN number</p>
                    </div>

                    {/* Card Body */}
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">TIN Number *</label>
                            <input
                                type="text"
                                placeholder="Enter TIN Number or Mobile Number"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-sm focus:ring-1 focus:ring-purple-500"
                            />
                        </div>

                        <button className="w-full py-3 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2">
                            <Search className="w-5 h-5" />
                            Search Information
                        </button>
                    </div>
                </div>
            </div>
        </ServiceGuard>
    );
}
