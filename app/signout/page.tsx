'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-slate-50 opacity-50 z-0"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200 rounded-full blur-[100px] opacity-30 animate-pulse delay-1000"></div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white max-w-sm w-full relative z-10 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <LogOut className="w-8 h-8" />
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">লগ আউট</h1>
                <p className="text-slate-500 mb-8 text-sm">
                    আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট থেকে লগ আউট করতে চান?
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        ফিরে যান
                    </button>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 shadow-lg shadow-red-200 transition"
                    >
                        লগ আউট
                    </button>
                </div>
            </div>
        </div>
    );
}
