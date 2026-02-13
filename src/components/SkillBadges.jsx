import { Award, ShieldCheck, Flame } from "lucide-react";

const BADGES = [
    { icon: ShieldCheck, label: "Team Player", color: "text-blue-400" },
    { icon: Flame, label: "Speedster", color: "text-orange-500" },
    { icon: Award, label: "Closer", color: "text-primary" },
    { icon: Star, label: "MVP", color: "text-yellow-400" },
];

import { Star } from "lucide-react";

export function SkillBadges() {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {BADGES.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                    <div
                        key={idx}
                        className="flex-shrink-0 flex flex-col items-center gap-2 bg-secondary/50 border border-white/5 rounded-2xl p-4 w-24 hover:border-primary/50 transition-colors group"
                    >
                        <div className={`p-2 rounded-full bg-white/5 ${badge.color} group-hover:scale-110 transition-transform`}>
                            <Icon size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase text-center text-white/60">{badge.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
