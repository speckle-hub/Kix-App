import React from 'react';
import { MapPin } from 'lucide-react';

export function PitchMarker({ name, onClick }) {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col items-center gap-1 transition-transform hover:scale-110 active:scale-95"
        >
            <div className="bg-background border-2 border-primary p-2 rounded-2xl shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-colors group-hover:bg-primary group-hover:text-background text-primary">
                <MapPin size={20} fill="currentColor" fillOpacity={0.2} />
            </div>
            <div className="px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] font-bold text-white uppercase whitespace-nowrap">{name}</span>
            </div>
        </button>
    );
}
