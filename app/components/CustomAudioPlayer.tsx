'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface CustomAudioPlayerProps {
    src: string;
}

export default function CustomAudioPlayer({ src }: CustomAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    // Simulate waveform bars (deterministic 'random' using sin/cos to avoid hydration mismatch)
    const [waveform] = useState(() => Array.from({ length: 40 }, (_, i) => Math.floor(Math.abs(Math.sin(i * 123.45)) * 60) + 20));

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "০০:০০";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Convert to Bengali digits
        return timeString.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current) return;
        const width = e.currentTarget.clientWidth;
        const clickX = e.nativeEvent.offsetX;
        const newTime = (clickX / width) * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-6 border border-slate-100/50">
            <audio ref={audioRef} src={src} />

            {/* Waveform Visualization / Progress */}
            <div className="mb-6 flex items-center justify-between gap-1 h-12 cursor-pointer group" onClick={handleSeek}>
                {waveform.map((height, idx) => {
                    const progress = (currentTime / duration) || 0;
                    const isActive = idx / waveform.length < progress;
                    return (
                        <div
                            key={idx}
                            className={`w-1.5 rounded-full transition-all duration-200 group-hover:scale-y-110 ${isActive ? 'bg-purple-600' : 'bg-purple-100'}`}
                            style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-400 w-10">{formatTime(currentTime)}</span>

                <div className="flex items-center gap-4">
                    <button className="text-purple-300 hover:text-purple-600 transition">
                        <SkipBack className="w-5 h-5 fill-current" />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-14 h-14 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg shadow-purple-600/30 transition-all transform hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? (
                            <Pause className="w-6 h-6 fill-current" />
                        ) : (
                            <Play className="w-6 h-6 fill-current ml-1" /> // offset for visual centering
                        )}
                    </button>

                    <button className="text-purple-300 hover:text-purple-600 transition">
                        <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                </div>

                <span className="text-xs font-bold text-slate-400 w-10 text-right">{formatTime(duration)}</span>
            </div>
        </div>
    );
}
