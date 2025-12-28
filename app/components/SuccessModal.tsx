import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useEffect } from 'react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    serviceFee?: string;
}

export default function SuccessModal({
    isOpen,
    onClose,
    title = 'Successfully Completed!',
    message,
    serviceFee
}: SuccessModalProps) {

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 transition-all"
                        onClick={onClose}
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                            className="bg-white w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 pt-10 flex flex-col items-center text-center">
                                {/* Success Icon with Halo */}
                                <div className="mb-6 relative">
                                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                                        <div className="w-16 h-16 bg-[#00C988] rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                                            <Check className="w-8 h-8 text-white stroke-[3]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="text-xl font-bold text-[#1e293b] mb-2 tracking-tight">
                                    {title}
                                </h2>

                                {/* Message */}
                                <p className="text-slate-500 mb-6 text-[15px] leading-relaxed max-w-[280px]">
                                    {message}
                                </p>

                                {/* Fee Badge */}
                                {serviceFee && (
                                    <div className="mb-8 bg-green-50 text-[#00C988] px-4 py-1.5 rounded-full text-sm font-bold">
                                        Fee deducted: {serviceFee}
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={onClose}
                                    className="w-full py-3.5 bg-[#0f172a] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg"
                                >
                                    Okay
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
