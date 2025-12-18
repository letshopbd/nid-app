'use client';

import { Calculator, Search } from 'lucide-react';

import ServiceGuard from '@/app/components/ServiceGuard';

export default function TinCertificatePage() {
    return (
        <ServiceGuard serviceName="Tin Certificate">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">টিন সার্টিফিকেট</h1>
                    <p className="text-sm text-slate-500">টিন-এর তথ্য দিয়ে সার্টিফিকেট তৈরি করুন</p>
                </div>

                {/* Marquee Banner */}


                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Card Header (Purple Gradient) */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-6 text-white">
                        <h2 className="text-xl font-bold mb-1">তথ্য অনুসন্ধান</h2>
                        <p className="text-purple-100 text-sm">টিন নম্বর দিয়ে তথ্য খুঁজুন</p>
                    </div>

                    {/* Card Body */}
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">টিন নম্বর *</label>
                            <input
                                type="text"
                                placeholder="টিন নাম্বার অথবা মোবাইল নাম্বার লিখুন"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-sm focus:ring-1 focus:ring-purple-500"
                            />
                        </div>

                        <button className="w-full py-3 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2">
                            <Search className="w-5 h-5" />
                            তথ্য অনুসন্ধান করুন
                        </button>
                    </div>
                </div>
            </div>
        </ServiceGuard>
    );
}
