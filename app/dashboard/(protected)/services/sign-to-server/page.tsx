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
                        <h1 className="text-2xl font-bold text-slate-900">সাইন টু সার্ভার কপি</h1>
                        <p className="text-sm text-slate-500">আপনার তথ্য দিয়ে ফর্ম পূরণ করুন</p>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
                    {/* PDF Upload Section */}
                    <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 transition group">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 mb-3 group-hover:scale-110 transition">
                            <FileText className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-blue-600">সাইন কপি এখানে ক্লিক করে লোড করুন। (PDF only)</p>
                    </div>

                    {/* Radio Type Selection */}
                    <div className="flex flex-col items-center justify-center space-y-3 p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-semibold text-slate-700">সার্ভার কপি টাইপ নির্বাচন করুন</p>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={type === 'old'}
                                    onChange={() => setType('old')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm text-slate-700">পুরাতন (QR)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={type === 'new'}
                                    onChange={() => setType('new')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm text-slate-700">নতুন (No QR)</span>
                            </label>
                        </div>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="নাম (বাংলায়) *" placeholder="আপনার নাম বাংলায়" />
                        <InputField label="নাম (ইংরেজীতে) *" placeholder="আপনার নাম ইংরেজীতে" />

                        <InputField label="এনআইডি নম্বর *" placeholder="এনআইডি নম্বর" />
                        <InputField label="পিন নম্বর *" placeholder="পিন নম্বর" />

                        <InputField label="ফরম নম্বর *" placeholder="ফরম নম্বর" />
                        <InputField label="ভোটার নম্বর" placeholder="ভোটার নম্বর" />

                        <InputField label="ভোটার এরিয়া *" placeholder="ভোটার এরিয়া" />
                        <InputField label="ধর্ম *" placeholder="ধর্ম" />

                        <InputField label="পিতার নাম *" placeholder="পিতার নাম বাংলায়" />
                        <InputField label="মাতার নাম *" placeholder="মাতার নাম বাংলায়" />

                        <InputField label="স্বামী/স্ত্রীর নাম" placeholder="স্বামী/স্ত্রীর নাম বাংলায়" />
                        <InputField label="শিক্ষাগত যোগ্যতা *" placeholder="শিক্ষাগত যোগ্যতা" />

                        <InputField label="জন্মস্থান *" placeholder="জন্মস্থান (অঞ্চল)" />
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">জন্ম তারিখ *</label>
                            <input type="date" placeholder="mm/dd/yyyy" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">রক্তের গ্রুপ</label>
                            <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm bg-white">
                                <option>রক্তের গ্রুপ নির্বাচন করুন</option>
                                <option>A+</option>
                                <option>B+</option>
                                <option>AB+</option>
                                <option>O+</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">লিঙ্গ *</label>
                            <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm bg-white">
                                <option>লিঙ্গ নির্বাচন করুন</option>
                                <option>পুরুষ</option>
                                <option>মহিলা</option>
                                <option>অন্যান্য</option>
                            </select>
                        </div>
                    </div>

                    {/* Address Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">বর্তমান ঠিকানা *</label>
                            <textarea
                                rows={3}
                                placeholder="বাসা/হোল্ডিং, গ্রাম/মহল্লা এলাকা, ডাকঘর, উপজেলা (Post Office - Postal Code), জেলা, বিভাগ, বাংলাদেশ/সংশ্লিষ্ট দেশ"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm resize-none"
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">স্থায়ী ঠিকানা *</label>
                            <textarea
                                rows={3}
                                placeholder="বাসা/হোল্ডিং, গ্রাম/মহল্লা এলাকা, ডাকঘর, উপজেলা (Post Office - Postal Code), জেলা, বিভাগ, বাংলাদেশ/সংশ্লিষ্ট দেশ"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button className="w-full py-4 bg-[#00c988] text-white font-bold rounded-lg hover:bg-[#00b57a] transition shadow-md flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    সার্ভার কপি তৈরি এবং ডাউনলোড করুন
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
