
'use client';

import { useEffect, useState } from 'react';

/**
 * NoticeBanner Component
 * Fetches system settings (notices) and displays them in a scrolling marquee.
 */
export default function NoticeBanner() {
    const [notices, setNotices] = useState<string[]>([]);
    const [config, setConfig] = useState({ speed: '20', size: 'text-sm', gap: '4' });

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const res = await fetch('/api/settings/payment?t=' + Date.now());
                const data = await res.json();
                if (data.siteNotices && Array.isArray(data.siteNotices)) {
                    setNotices(data.siteNotices);
                }
                if (data.noticeConfig) {
                    setConfig(data.noticeConfig);
                }
            } catch (error) {
                console.error('Failed to fetch notices:', error);
            }
        };

        fetchNotices();
        const interval = setInterval(fetchNotices, 5000); // Poll every 5 seconds for "live" updates
        return () => clearInterval(interval);
    }, []);

    // Cycle notices
    useEffect(() => {
        if (notices.length <= 1) return;
        const duration = parseInt(config.speed) * 1000 || 5000;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % notices.length);
        }, duration);
        return () => clearInterval(timer);
    }, [notices, config.speed]);

    if (notices.length === 0) return null;

    return (
        <div className="bg-yellow-100 border-b border-yellow-200 overflow-hidden py-3 relative flex justify-center items-center min-h-[40px]">
            {/* 
               We use a key on the container or the motion element to trigger re-renders 
               But AnimatePresence is best for mounting/unmounting.
               We need absolute positioning for the exiting element if we want cross-fade, 
               but a simple fade-out-then-in is often cleaner for text banners if height is variable.
               For a banner, usually cross-fade is nice. 
             */}
            <div className="relative w-full text-center px-4">
                <style jsx global>{`
                    .fade-enter { opacity: 0; transform: translateY(10px); }
                    .fade-enter-active { opacity: 1; transform: translateY(0); transition: opacity 300ms, transform 300ms; }
                    .fade-exit { opacity: 1; transform: translateY(0); }
                    .fade-exit-active { opacity: 0; transform: translateY(-10px); transition: opacity 300ms, transform 300ms; }
                `}</style>

                {/* Simple CSS transition approach since we might not want to add heavy framer-motion client side bundle just for this if not needed, 
                    but user has framer-motion installed. Let's use standard React rendering with key. 
                    Actually, let's stick to standard CSS animation classes or just vanilla React state for simplicity and performance unless framer-motion is strictly requested.
                    The plan mentioned framer-motion or CSS. Let's use CSS for lightweight.
                */}
                {notices.map((notice, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${idx === currentIndex
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4 pointer-events-none'
                            }`}
                    >
                        <span className={`text-amber-800 font-medium px-2 ${config.size}`}>
                            {notice}
                        </span>
                    </div>
                ))}
                {/* Spacer to keep height correct based on largest text (or just current) */}
                <div className={`invisible ${config.size} font-medium px-2 py-1`}>
                    {notices[0]} {/* Placeholder for height */}
                </div>
            </div>
        </div>
    );
}
