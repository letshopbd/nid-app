'use client';

import { Upload, FileText, Download } from 'lucide-react';
import { useState } from 'react';

import ServiceGuard from '@/app/components/ServiceGuard';

export default function SignToServerCopyPage() {
    const [type, setType] = useState('new');

    return (
        <ServiceGuard serviceName="Sign to Server Copy">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    {/* Back button placeholder if needed, image showed an arrow but standard layout might not have it. omitting for consistency with other pages unless requested */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Sign to Server Copy</h1>
                        <p className="text-sm text-slate-500">Fill the form with your information</p>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
                    {/* PDF Upload Section */}
                    <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 transition group">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 mb-3 group-hover:scale-110 transition">
                            <FileText className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-blue-600">Click here to upload Sign Copy. (PDF only)</p>
                    </div>

                    {/* Radio Type Selection */}
                    <div className="flex flex-col items-center justify-center space-y-3 p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-semibold text-slate-700">Select Server Copy Type</p>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={type === 'old'}
                                    onChange={() => setType('old')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm text-slate-700">Old (QR)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={type === 'new'}
                                    onChange={() => setType('new')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm text-slate-700">New (No QR)</span>
                            </label>
                        </div>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Name (Bangla) *" placeholder="Your Name in Bangla" />
                        <InputField label="Name (English) *" placeholder="Your Name in English" />

                        <InputField label="NID Number *" placeholder="NID Number" />
                        <InputField label="PIN Number *" placeholder="PIN Number" />

                        <InputField label="Form Number *" placeholder="Form Number" />
                        <InputField label="Voter Number" placeholder="Voter Number" />

                        <InputField label="Voter Area *" placeholder="Voter Area" />
                        <InputField label="Religion *" placeholder="Religion" />

                        <InputField label="Father's Name *" placeholder="Father's Name in Bangla" />
                        <InputField label="Mother's Name *" placeholder="Mother's Name in Bangla" />

                        <InputField label="Spouse Name" placeholder="Spouse Name in Bangla" />
                        <InputField label="Education *" placeholder="Education Qualification" />

                        <InputField label="Place of Birth *" placeholder="Place of Birth (District)" />
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Date of Birth *</label>
                            <input type="date" placeholder="mm/dd/yyyy" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm" />
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
                            <label className="text-sm font-semibold text-slate-700">Gender *</label>
                            <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm bg-white">
                                <option>Select Gender</option>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Address Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Current Address *</label>
                            <textarea
                                rows={3}
                                placeholder="House/Holding, Village/Area, Post Office (Code), Upazila, District, Division, Country"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm resize-none"
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Permanent Address *</label>
                            <textarea
                                rows={3}
                                placeholder="House/Holding, Village/Area, Post Office (Code), Upazila, District, Division, Country"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button className="w-full py-4 bg-[#00c988] text-white font-bold rounded-lg hover:bg-[#00b57a] transition shadow-md flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Create Server Copy & Download
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
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm placeholder-slate-400"
            />
        </div>
    );
}
