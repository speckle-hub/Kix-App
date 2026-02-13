import React from 'react';
import { Shield, Zap, Target, Star } from "lucide-react";

export function StatSliders({ stats, setStats }) {
    const handleChange = (key, value) => {
        setStats(prev => ({ ...prev, [key]: parseInt(value) }));
    };

    const attributes = [
        { key: 'pace', label: 'Pace', icon: Zap },
        { key: 'shooting', label: 'Shooting', icon: Target },
        { key: 'passing', label: 'Passing', icon: Shield },
        { key: 'dribbling', label: 'Dribbling', icon: Star },
        { key: 'physical', label: 'Physical', icon: Star },
    ];

    return (
        <div className="bg-secondary/30 rounded-3xl p-6 border border-white/5 space-y-6">
            <h3 className="text-lg font-condensed text-white/60 mb-2 uppercase tracking-widest">Adjust Attributes</h3>
            {attributes.map(({ key, label, icon: Icon }) => (
                <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <Icon size={14} className="text-primary" />
                            <span className="font-bold uppercase tracking-wider">{label}</span>
                        </div>
                        <span className="text-primary font-bold">{stats[key]}</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="99"
                        value={stats[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
            ))}
        </div>
    );
}
