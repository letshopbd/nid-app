'use client';

import { Upload, FileText, User, FileSignature, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import ServiceGuard from '@/app/components/ServiceGuard';

export default function SignCopyToNidPage() {
    return (
        <ServiceGuard serviceName="Sign Copy to NID">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">New NID</h1>
                    <p className="text-sm text-slate-500">Create new NID and fill in required information</p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
                    {/* PDF Upload Section */}
                    <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 transition group">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 mb-3 group-hover:scale-110 transition">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Sign Copy</h3>
                        <p className="text-sm text-slate-500">Click here to upload (PDF only)</p>
                    </div>

                    {/* Photo & Signature Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* NID Photo */}
                        <div className="border border-slate-300 rounded-lg overflow-hidden">
                            <div className="h-48 bg-slate-50 flex items-center justify-center border-b border-slate-300 relative">
                                <span className="absolute top-2 left-2 text-xs font-semibold text-red-500">NID Photo *</span>
                                <User className="w-16 h-16 text-slate-300" />
                            </div>
                            <div className="p-3 bg-white flex items-center justify-between">
                                <button className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50">
                                    <Upload className="w-3 h-3" /> Choose File
                                </button>
                                <span className="text-xs text-slate-400">No file chosen</span>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="border border-slate-300 rounded-lg overflow-hidden">
                            <div className="h-48 bg-slate-50 flex items-center justify-center border-b border-slate-300 relative">
                                <span className="absolute top-2 left-2 text-xs font-semibold text-slate-600">Signature</span>
                                <FileSignature className="w-16 h-16 text-slate-300" />
                            </div>
                            <div className="p-3 bg-white flex items-center justify-between">
                                <button className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50">
                                    <Upload className="w-3 h-3" /> Choose File
                                </button>
                                <span className="text-xs text-slate-400">No file chosen</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Name (Bangla) *" placeholder="Full Name in Bangla" />
                        <InputField label="Name (English) *" placeholder="Full Name in English" />

                        <InputField label="NID Number *" placeholder="NID Number" />
                        <InputField label="PIN Number *" placeholder="PIN Number" />

                        <InputField label="Father's Name *" placeholder="Father's Name in Bangla" />
                        <InputField label="Mother's Name *" placeholder="Mother's Name in Bangla" />

                        <InputField label="Place of Birth *" placeholder="Place of Birth (District)" />
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Date of Birth *</label>
                            <input type="date" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Blood Group</label>
                            <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm bg-white">
                                <option>Select Blood Group</option>
                                <option>A+</option>
                                <option>B+</option>
                                <option>AB+</option>
                                <option>O+</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Date of Issue *</label>
                            <input type="date" defaultValue="2025-12-15" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm" />
                        </div>
                    </div>

                    {/* Address Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Address *</label>
                        <textarea
                            rows={3}
                            placeholder="House/Holding: (Holding), Village/Road: (Village, Road), Post Office: (Post Office-Postal Code), Upazila, City Corporation/Municipality, District"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm resize-none"
                        ></textarea>
                    </div>
                </div>

                {/* Submit Button */}
                <button className="w-full py-4 bg-[#00c988] text-white font-bold rounded-lg hover:bg-[#00b57a] transition shadow-md">
                    Create & Download NID
                </button>
            </div>
        </ServiceGuard>
    );
}

function InputField({ label, placeholder, type = "text" }: { label: string, placeholder: string, type?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm placeholer-slate-400"
            />
        </div>
    );
}
