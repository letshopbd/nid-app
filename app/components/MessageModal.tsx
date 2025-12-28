'use client';

import { X, CheckCircle, AlertOctagon, Info } from 'lucide-react';

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

export default function MessageModal({ isOpen, onClose, title, message, type = 'info' }: MessageModalProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4"><CheckCircle className="w-6 h-6" /></div>;
            case 'error': return <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4"><AlertOctagon className="w-6 h-6" /></div>;
            default: return <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><Info className="w-6 h-6" /></div>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {getIcon()}
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">{message}</p>

                    <button
                        onClick={onClose}
                        className={`w-full py-3 rounded-xl font-bold text-white transition transform active:scale-[0.98] ${type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20' :
                                type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20' :
                                    'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                            }`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
