import React from 'react';

export function ClusterMarker({ count, onClick }) {
    // scale size based on count
    const size = count < 10 ? 30 : count < 50 ? 40 : 50;

    return (
        <button
            onClick={onClick}
            className="group relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            style={{ width: size, height: size }}
        >
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
            <div className="relative w-full h-full bg-primary/80 backdrop-blur-md rounded-full border-2 border-primary flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                <span className="text-background font-bold text-sm tracking-tighter">
                    {count}
                </span>
            </div>
        </button>
    );
}
