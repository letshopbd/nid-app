'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * UserNotificationSystem
 * 
 * Logic:
 * - Polls /api/user/requests AND /api/user/recharge every 1 second.
 * - Detects status changes for:
 *   1. File Orders (PENDING -> COMPLETED/PAID or CANCELLED/REJECTED)
 *   2. Recharge Requests (PENDING -> APPROVED or REJECTED)
 * 
 * - Plays sound based on change:
 *   - Success (COMPLETED/PAID/APPROVED) -> 1 Ding
 *   - Error (CANCELLED/REJECTED) -> 2 Dings (Same sound, played twice)
 */
export default function UserNotificationSystem() {
    const [orders, setOrders] = useState<any[]>([]);
    const [recharges, setRecharges] = useState<any[]>([]);
    const firstLoad = useRef(true);

    // Reusable function to schedule a single "Ding-Dong" on an existing context
    const scheduleDingDong = (ctx: AudioContext, startTime: number) => {
        // Note 1: C5 (523Hz) - The "Ding"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, startTime);

        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.start(startTime);
        osc.stop(startTime + 0.4);

        // Note 2: E5 (659Hz) - The "Dong"
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, startTime + 0.15); // Slight delay

        gain2.gain.setValueAtTime(0.1, startTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc2.start(startTime + 0.15);
        osc2.stop(startTime + 0.6);
    };

    // Play 1 Ding-Dong (Success)
    const playSuccess = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const now = ctx.currentTime;

            scheduleDingDong(ctx, now);

            // Cleanup context after sound finishes
            setTimeout(() => {
                ctx.close();
            }, 1000);

        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    // Play 2 Ding-Dongs (Cancel/Reject)
    const playDoubleDing = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const now = ctx.currentTime;

            // First Ding
            scheduleDingDong(ctx, now);

            // Second Ding (0.3s gap + duration)
            scheduleDingDong(ctx, now + 0.35);

            // Cleanup context after both sounds finish
            setTimeout(() => {
                ctx.close();
            }, 1500);

        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const timestamp = Date.now();
                // Fetch both lists in parallel
                // OPTIMIZATION: Limit to last 20 items to reduce load
                const [resOrders, resRecharges] = await Promise.all([
                    fetch(`/api/user/requests?limit=20&t=${timestamp}`),
                    fetch(`/api/user/recharge?limit=20&t=${timestamp}`)
                ]);

                if (resOrders.ok && resRecharges.ok) {
                    const dataOrders = await resOrders.json();
                    const dataRecharges = await resRecharges.json();

                    // --- 1. Process Orders ---
                    setOrders(prevOrders => {
                        if (!firstLoad.current) {
                            let successCount = 0;
                            let errorCount = 0;

                            dataOrders.forEach((newOrder: any) => {
                                const oldOrder = prevOrders.find((p: any) => p.id === newOrder.id);
                                if (oldOrder) {
                                    // Success: COMPLETED, PAID
                                    if ((oldOrder.status !== 'COMPLETED' && newOrder.status === 'COMPLETED') ||
                                        (oldOrder.status !== 'PAID' && newOrder.status === 'PAID')) {
                                        successCount++;
                                    }
                                    // Error: CANCELLED, REJECTED
                                    if ((oldOrder.status !== 'CANCELLED' && newOrder.status === 'CANCELLED') ||
                                        (oldOrder.status !== 'REJECTED' && newOrder.status === 'REJECTED')) {
                                        errorCount++;
                                    }
                                }
                            });

                            // Queue Order Sounds
                            let delay = 0;
                            for (let i = 0; i < successCount; i++) {
                                setTimeout(playSuccess, delay);
                                delay += 800;
                            }
                            for (let i = 0; i < errorCount; i++) {
                                setTimeout(playDoubleDing, delay);
                                delay += 1200;
                            }
                        }
                        return dataOrders;
                    });

                    // --- 2. Process Recharges ---
                    setRecharges(prevRecharges => {
                        if (!firstLoad.current) {
                            let successCount = 0;
                            let errorCount = 0;

                            dataRecharges.forEach((newReq: any) => {
                                const oldReq = prevRecharges.find((p: any) => p.id === newReq.id);
                                if (oldReq) {
                                    // Success: APPROVED
                                    if (oldReq.status !== 'APPROVED' && newReq.status === 'APPROVED') {
                                        successCount++;
                                    }
                                    // Error: REJECTED
                                    if (oldReq.status !== 'REJECTED' && newReq.status === 'REJECTED') {
                                        errorCount++;
                                    }
                                }
                            });

                            // Queue Recharge Sounds (Add to existing delay if needed, but for now independent queues is okay as browser handles async well, just might overlap if exact same second. Overlap is acceptable, or we can use a global queue ref but that's complex.)
                            // Triggering independent sounds for recharges:
                            let delay = 100; // Slight offset to avoid exact collision
                            for (let i = 0; i < successCount; i++) {
                                setTimeout(playSuccess, delay);
                                delay += 800;
                            }
                            for (let i = 0; i < errorCount; i++) {
                                setTimeout(playDoubleDing, delay);
                                delay += 1200;
                            }
                        }
                        return dataRecharges;
                    });

                    // After processing both, set firstLoad to false
                    if (firstLoad.current) {
                        firstLoad.current = false;
                    }
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        };

        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 1000); // Poll every 1s

        return () => clearInterval(interval);
    }, []);

    return null; // Headless component
}
