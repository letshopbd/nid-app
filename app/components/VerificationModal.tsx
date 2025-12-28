import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    captchaImage: string | null;
    loading: boolean;
    onSubmit: (answer: string) => void;
    status: string; // 'IDLE' | 'FETCHING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'
    error?: string;
}

export default function VerificationModal({
    isOpen,
    onClose,
    captchaImage,
    loading,
    onSubmit,
    status,
    error
}: VerificationModalProps) {
    const [answer, setAnswer] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setAnswer('');
        }
    }, [isOpen]);

    // Prevent scrolling
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (answer.trim()) onSubmit(answer.trim());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white w-full max-w-[400px] rounded-2xl shadow-xl overflow-hidden relative"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Auto Verification</h3>
                            <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {status === 'FETCHING' && (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">Connecting to Govt Server...</p>
                                </div>
                            )}

                            {status === 'VERIFYING' && (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">Verifying & Generating PDF...</p>
                                    <p className="text-xs text-slate-400 mt-1">This may take up to 20 seconds</p>
                                </div>
                            )}

                            {status === 'SUCCESS' && (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-1">Success!</h4>
                                    <p className="text-sm text-slate-500">File attached and order completed.</p>
                                    <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-100 font-bold text-slate-700 rounded-lg hover:bg-slate-200">Close</button>
                                </div>
                            )}

                            {status === 'IDLE' && captchaImage && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-sm text-slate-500 mb-3">Solve the math to verify:</p>
                                        <div className="bg-white border rounded-lg p-2 inline-block shadow-sm">
                                            <img src={captchaImage} alt="Captcha" className="h-12 object-contain" />
                                        </div>
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            placeholder="Enter answer (e.g. 45)"
                                            className="w-full text-center text-lg font-bold p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!answer}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        Verify & Attach PDF
                                    </button>
                                </form>
                            )}

                            {status === 'ERROR' && (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <X className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div className="text-red-600 text-lg font-bold mb-2">Verification Failed</div>
                                    <p className="text-slate-500 text-sm mb-6 px-4">{error || 'Something went wrong.'}</p>
                                    <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Close</button>
                                </div>
                            )}

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
