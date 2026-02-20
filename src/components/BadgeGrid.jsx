import React from 'react';
import { BADGES } from '../constants/badges';

export function BadgeGrid({ earnedBadges }) {
    const earnedIds = new Set(earnedBadges?.map(b => b.id) || []);

    const badgeList = Object.values(BADGES);

    return (
        <div className="grid grid-cols-3 gap-4 p-4 capitalize">
            {badgeList.map((badge) => {
                const isEarned = earnedIds.has(badge.id);
                const earnedData = earnedBadges?.find(b => b.id === badge.id);

                return (
                    <div
                        key={badge.id}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${isEarned
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-white/5 border-white/5 opacity-40 grayscale'
                            }`}
                    >
                        <div className={`text-3xl filter drop-shadow-lg ${isEarned ? 'animate-bounce-subtle' : ''}`}>
                            {badge.icon}
                        </div>
                        <div className="text-center space-y-0.5">
                            <p className="text-[10px] font-bold text-white leading-tight">{badge.name}</p>
                            <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block ${badge.tier === 'gold' ? 'bg-yellow-500/20 text-yellow-500' :
                                    badge.tier === 'silver' ? 'bg-slate-300/20 text-slate-300' :
                                        'bg-orange-500/20 text-orange-500'
                                }`}>
                                {badge.tier}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
