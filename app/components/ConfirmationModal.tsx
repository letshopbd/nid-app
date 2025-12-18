'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'danger',
    confirmText = 'Yes, Confirm',
    cancelText = 'Cancel'
}: ConfirmationModalProps) {

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

    const isDanger = type === 'danger';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative Top Pattern */}
                            <div className={`absolute top-0 left-0 w-full h-32 opacity-10 rounded-b-[50%] ${isDanger ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`} />

                            <div className="p-8 pt-12 flex flex-col items-center text-center relative z-10">
                                {/* Icon Animation */}
                                <div className="mb-6 relative">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg ${isDanger ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'}`}
                                    >
                                        {isDanger ? <AlertCircle className="w-10 h-10 stroke-[2]" /> : <HelpCircle className="w-10 h-10 stroke-[2]" />}
                                    </motion.div>

                                    {/* Ripple Effect */}
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0.5 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className={`absolute inset-0 rounded-full -z-10 ${isDanger ? 'bg-red-400' : 'bg-blue-400'}`}
                                    />
                                </div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-bold text-slate-800 mb-2"
                                >
                                    {title}
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-slate-500 mb-8 px-4"
                                >
                                    {message}
                                </motion.p>

                                <div className="flex gap-3 w-full">
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        onClick={onClose}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        {cancelText}
                                    </motion.button>
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800'}`}
                                    >
                                        {confirmText}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Close Button Top Right */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
