import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { getReliabilityTier } from '../lib/rpg';

export function ReliabilityBadge({ score = 100, showLabel = true, size = 'md' }) {
    const tier = getReliabilityTier(score);

    const sizes = {
        sm: { icon: 10, text: 'text-[8px]', padding: 'px-1.5 py-0.5', gap: 'gap-1' },
        md: { icon: 12, text: 'text-[10px]', padding: 'px-2 py-1', gap: 'gap-1.5' },
        lg: { icon: 14, text: 'text-xs', padding: 'px-3 py-1.5', gap: 'gap-2' },
    };

    const s = sizes[size] || sizes.md;

    return (
        <div className={`inline-flex items-center ${s.gap} ${s.padding} rounded-full border ${tier.bg} ${tier.color} ${tier.border} backdrop-blur-md`}>
            <ShieldCheck size={s.icon} />
            {showLabel && (
                <span className={`${s.text} font-bold uppercase tracking-widest`}>
                    {tier.label}
                </span>
            )}
            {size === 'lg' && (
                <div className="group relative">
                    <Info size={10} className="opacity-40 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-secondary/90 border border-white/10 rounded-xl text-[10px] text-white/60 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                        Reliability Score: <span className="text-white font-bold">{score}</span>
                        <br />
                        Based on match check-ins, no-shows, and host behavior.
                    </div>
                </div>
            )}
        </div>
    );
}
