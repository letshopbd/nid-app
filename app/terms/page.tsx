import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/app/lib/prisma";
import CustomAudioPlayer from "../components/CustomAudioPlayer";

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: 'terms_content' }
    });

    const audioSetting = await prisma.systemSetting.findUnique({
        where: { key: 'terms_audio_url' }
    });

    const content = setting?.value || `No terms and conditions content found. Please contact support.`;
    const audioUrl = audioSetting?.value;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/register" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-800">শর্তাবলী এবং নীতিমালা (Terms & Conditions)</h1>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 space-y-6" dangerouslySetInnerHTML={{ __html: content }} />

                {audioUrl && (
                    <div className="mt-16 bg-slate-50/50 p-8 rounded-3xl border border-white/50 shadow-inner">
                        <div className="text-center mb-8">
                            <h3 className="text-lg font-bold text-slate-800">অডিও সংস্করণ শুনুন</h3>
                            <p className="text-sm text-slate-400">শর্তাবলী এবং নীতিমালা অডিও ফরম্যাটে শুনতে পারেন</p>
                        </div>
                        <CustomAudioPlayer src={audioUrl} />
                    </div>
                )}
            </div>
        </div>
    );
}
