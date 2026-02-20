import React from 'react';
import { MapPin } from 'lucide-react';

export function PitchMarker({ pitch, active, onClick }) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="group relative flex flex-col items-center gap-1 transition-transform hover:scale-110 active:scale-95"
        >
            <div className={`
                p-2 rounded-2xl shadow-lg transition-all duration-300
                ${active
                    ? 'bg-primary text-background scale-110 shadow-[0_0_20px_#39FF14]'
                    : 'bg-background border-2 border-primary/40 text-primary hover:border-primary/80'}
            `}>
                <MapPin size={active ? 24 : 20} fill="currentColor" fillOpacity={active ? 0.4 : 0.2} />
            </div>

            {/* Tooltip on hover */}
            <div className="absolute -top-10 px-3 py-1 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none -translate-y-2 group-hover:translate-y-0">
                <span className="text-[10px] font-bold text-white uppercase whitespace-nowrap tracking-wider">{pitch.name}</span>
            </div>
        </button>
    );
}
