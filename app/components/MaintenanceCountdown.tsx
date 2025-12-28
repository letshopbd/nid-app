'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MaintenanceCountdownProps {
    initialTargetTime?: string | null;
    initialPendingStatus?: string | null;
}

export default function MaintenanceCountdown({ initialTargetTime, initialPendingStatus }: MaintenanceCountdownProps) {
    const [targetTime, setTargetTime] = useState<string | null | undefined>(initialTargetTime);
    const [pendingStatus, setPendingStatus] = useState<string | null | undefined>(initialPendingStatus);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isUrgent, setIsUrgent] = useState(false);
    const router = useRouter();

    // Poll for status updates
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/system/status');
                if (res.ok) {
                    const data = await res.json();
                    if (data.maintenanceTarget) {
                        setTargetTime(data.maintenanceTarget);
                        // The API returns 'status' (activeStatus) and 'maintenanceTarget'. 
                        // It doesn't explicitly return pendingStatus separate from activeStatus if activeStatus isn't pending.
                        // However, we can infer "Maintenance" or "Dev Mode" generally.
                        // For this banner, let's default to "Maintenance" if pending status isn't explicit, 
                        // or better yet, just leave pendingStatus as is (from initial) unless we update API.
                        // But wait, if I start a NEW maintenance, initialPendingStatus was null.
                        // I need to know if it's DEV or DOWN.
                        // Let's assume generic "Maintenance" message if we don't know, OR
                        // Update API to return pendingStatus.
                        // For now, I will use a generic message if pendingStatus is missing, or just 'Maintenance'.
                    } else {
                        setTargetTime(null);
                    }
                }
            } catch (error) {
                console.error('Failed to update status');
            }
        };

        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!targetTime) {
            setTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetTime).getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft('00:00');
                router.refresh();
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            setIsUrgent(distance < 60000);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetTime, router]);

    if (!targetTime) return null;

    return (
        <div className={`
            fixed bottom-0 left-0 right-0 z-50 p-4 shadow-lg backdrop-blur-md border-t
            flex items-center justify-center gap-4 transition-colors duration-300
            ${isUrgent ? 'bg-red-500/90 border-red-600 text-white' : 'bg-orange-500/90 border-orange-600 text-white'}
        `}>
            <div className="flex items-center gap-3 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
                <div className="text-center md:text-left">
                    <p className="font-bold text-lg md:text-xl">
                        System Entering {pendingStatus === 'DEV' ? 'Development Mode' : 'Maintenance'}
                    </p>
                    <p className="text-sm opacity-90">
                        Please save your work. Access will be restricted in:
                    </p>
                </div>
            </div>

            <div className={`
                px-4 py-2 rounded-xl font-mono text-2xl md:text-3xl font-bold bg-black/20
                ${isUrgent ? 'text-white' : 'text-white'}
            `}>
                {timeLeft}
            </div>
        </div>
    );
}
