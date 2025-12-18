'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * AdminNotificationSystem
 * 
 * Logic:
 * - Polls /api/admin/stats/sidebar every 1 second.
 * - Detects ANY increase in pending orders or recharges.
 * - Plays "Ding-Dong" (Same as User Dashboard Success Sound).
 * - FIX: Proper AudioContext cleanup.
 * - FIX: Added Debounce to prevent double-triggering.
 */
export default function AdminNotificationSystem() {
    const [counts, setCounts] = useState({ orders: 0, recharges: 0 });
    const firstLoad = useRef(true);
    const lastPlayedTime = useRef(0); // For Debouncing

    // Play "Ding-Dong" (Matching User Dashboard Success)
    const playDingDong = () => {
        const timestamp = Date.now();
        // Debounce: Prevent playing again if played within last 2 seconds
        if (timestamp - lastPlayedTime.current < 2000) {
            return;
        }
        lastPlayedTime.current = timestamp;

        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const now = ctx.currentTime;

            // Note 1: C5 (523Hz) - The "Ding"
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.start(now);
            osc.stop(now + 0.4);

            // Note 2: E5 (659Hz) - The "Dong"
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(659.25, now + 0.15); // Slight delay

            gain2.gain.setValueAtTime(0.1, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc2.start(now + 0.15);
            osc2.stop(now + 0.6);

            // Cleanup to prevent memory leak / AudioContext limit
            setTimeout(() => {
                ctx.close();
            }, 1000);

        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Fetch stats with timestamp to bypass cache
                const res = await fetch(`/api/admin/stats/sidebar?t=${Date.now()}`);

                if (res.ok) {
                    const data = await res.json();

                    setCounts(prev => {
                        if (!firstLoad.current) {
                            // Check for ANY increase in pending items
                            if (data.pendingOrders > prev.orders || data.pendingRecharges > prev.recharges) {
                                playDingDong();
                            }
                        } else {
                            firstLoad.current = false;
                        }
                        return { orders: data.pendingOrders, recharges: data.pendingRecharges };
                    });
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        };

        fetchCounts(); // Initial fetch
        // Poll every 1 SECOND (1000ms) for instant notification
        const interval = setInterval(fetchCounts, 1000);

        return () => clearInterval(interval);
    }, []);

    return null; // Headless component
}
