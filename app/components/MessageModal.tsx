import { X, CheckCircle, AlertOctagon, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            case 'success': return (
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-[#00C988] rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                        <CheckCircle className="w-8 h-8 text-white stroke-[2.5]" />
                    </div>
                </div>
            );
            case 'error': return (
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                        <AlertOctagon className="w-8 h-8 text-white stroke-[2.5]" />
                    </div>
                </div>
            );
            default: return (
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                        <Info className="w-8 h-8 text-white stroke-[2.5]" />
                    </div>
                </div>
            );
        }
    };

    const getButtonColor = () => {
        // Uniform dark button for all types as per "Okay" design, or keep semantic?
        // User asked for "same to same ai image style" which had dark button.
        // Let's use the dark button for consistency, it looks more premium.
        return "bg-[#0f172a] hover:bg-slate-800";
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                    className="bg-white w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden relative z-10 p-8 pt-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        {getIcon()}

                        <h3 className="text-xl font-bold text-[#1e293b] mb-2 tracking-tight">
                            {title}
                        </h3>

                        <p className="text-slate-500 mb-8 text-[15px] leading-relaxed max-w-[280px]">
                            {message}
                        </p>

                        <button
                            onClick={onClose}
                            className={`w-full py-3.5 text-white rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg ${getButtonColor()}`}
                        >
                            Okay
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
