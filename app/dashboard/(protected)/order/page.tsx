'use client';

import { Search, Plus, Check } from 'lucide-react';

export default function OrderPage() {
    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">অর্ডার তালিকা</h1>
                    <p className="text-sm text-slate-500">মোট ০ টি অর্ডার পাওয়া গেছে</p>
                </div>
                <button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg active:scale-95 transition font-medium text-sm w-fit">
                    <Plus className="w-4 h-4" />
                    নতুন অর্ডার
                </button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="নাম/ফরম/এনআইডি দিয়ে খুঁজুন..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                    />
                </div>
                <div className="flex gap-4">
                    <select className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:border-blue-500 min-w-[120px]">
                        <option>সকল</option>
                    </select>
                    <select className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:border-blue-500 min-w-[120px]">
                        <option>সব সেবা</option>
                    </select>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-4 border-b border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50/50">
                    <div>সেবা</div>
                    <div>ধরন</div>
                    <div className="col-span-2">এনআইডি/ফরম নম্বর/ফোন</div>
                    <div>স্ট্যাটাস</div>
                    <div>তৈরির তারিখ</div>
                    {/* Action column implicit/empty text in image but usually there */}
                    <div className="text-right"> কার্যক্রম</div>
                </div>

                {/* Empty State */}
                <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                    <div className="w-16 h-16 text-slate-300 mb-4">
                        <Check className="w-full h-full" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">কোন অর্ডার পাওয়া যায়নি</h3>
                    <p className="text-sm text-slate-400">বর্তমানে কোন অর্ডার নেই</p>
                </div>
            </div>
        </div>
    );
}
