import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';


export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 text-center space-y-8">
      {/* 
      <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-4 transform rotate-3 hover:rotate-0 transition duration-500">
        <ShieldCheck className="w-10 h-10" />
      </div>
      */}

      <div className="space-y-4 max-w-2xl flex flex-col items-center">
        <Image
          src="/duronto_brand.png"
          alt="Duronto Seba"
          width={400}
          height={120}
          className="object-contain h-24 md:h-32 mb-4"
          priority
        />
        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Your trusted platform for NID services, birth registration, and more. Secure, fast, and trusted by 1000+ users.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-8 py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-900 transition flex items-center gap-2"
        >
          Enter Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/register"
          className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
