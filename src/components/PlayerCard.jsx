import { motion } from "framer-motion";
import { User, Trophy, Share2 } from "lucide-react";
import { calculateOVR, xpToLevel, levelProgress, xpForNextLevel } from "../lib/rpg";

const POSITIONS = ['ST', 'CF', 'CAM', 'CM', 'CDM', 'LW', 'RW', 'LB', 'RB', 'CB', 'GK'];

// SVG ring for level progress
function LevelRing({ progress, level, size = 80 }) {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * Math.max(0, Math.min(1, progress));
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rotate-[-90deg]">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke="#39FF14"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - dash }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ filter: 'drop-shadow(0 0 4px #39FF14)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-condensed font-bold text-primary leading-none">{level}</span>
                <span className="text-[8px] font-bold text-white/30 uppercase">LVL</span>
            </div>
        </div>
    );
}

export function PlayerCard({ stats, name = "Kix Player", position = "ST", nationality = "🇬🇧", xp = 0 }) {
    const level = xpToLevel(xp);
    const progress = levelProgress(xp);
    const ovr = calculateOVR(stats, position);
    const nextLvlXp = xpForNextLevel(level);
    const currentLvlXp = Math.pow(level, 2) * 100;
    const xpInLevel = xp - currentLvlXp;
    const xpNeeded = nextLvlXp - currentLvlXp;

    const displayStats = [
        { label: "PAC", value: stats.pace },
        { label: "SHO", value: stats.shooting },
        { label: "PAS", value: stats.passing },
        { label: "DRI", value: stats.dribbling },
        { label: "PHY", value: stats.physical },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-64 h-auto mx-auto"
        >
            {/* Card */}
            <motion.div
                animate={{
                    boxShadow: [
                        "0 0 20px rgba(57, 255, 20, 0.2)",
                        "0 0 40px rgba(57, 255, 20, 0.5)",
                        "0 0 20px rgba(57, 255, 20, 0.2)"
                    ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full bg-[#111] rounded-[2rem] overflow-hidden border border-primary/20 flex flex-col items-center p-6 text-white"
                style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #050505 100%)' }}
            >
                {/* Pulsing border */}
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 border-2 border-primary/40 rounded-[2rem] pointer-events-none"
                />

                {/* Top: OVR + Position + Level Ring */}
                <div className="w-full flex justify-between items-start mb-2">
                    <div className="flex flex-col items-start">
                        <span className="text-4xl font-condensed font-bold text-primary leading-none">{ovr}</span>
                        <span className="text-sm font-bold opacity-60">{position}</span>
                        <span className="text-xl mt-1">{nationality}</span>
                    </div>
                    <LevelRing progress={progress} level={level} size={72} />
                </div>

                {/* XP Bar */}
                <div className="w-full mb-3">
                    <div className="flex justify-between text-[9px] font-bold text-white/30 mb-1">
                        <span>XP {xpInLevel}</span>
                        <span>{xpNeeded} to Lv.{level + 1}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-primary rounded-full"
                            style={{ boxShadow: '0 0 6px #39FF14' }}
                        />
                    </div>
                </div>

                {/* Player Image */}
                <div className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md overflow-hidden mb-3">
                    <User size={56} className="text-white/20" />
                </div>

                {/* Name */}
                <h3 className="text-2xl font-condensed font-bold tracking-tight uppercase border-b border-primary/30 pb-2 w-full text-center mb-3">
                    {name}
                </h3>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 w-full px-4 mb-4">
                    {displayStats.map((s) => (
                        <div key={s.label} className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/40">{s.label}</span>
                            <span className="text-base font-condensed font-bold">{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Share + Trophy */}
                <div className="absolute bottom-4 right-6 flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(window.location.href);
                        }}
                        className="p-2 bg-white/5 hover:bg-primary/20 rounded-full transition-colors border border-white/5 group/share"
                    >
                        <Share2 size={16} className="text-white/40 group-hover/share:text-primary transition-colors" />
                    </button>
                    <div className="opacity-20">
                        <Trophy size={20} className="text-primary" />
                    </div>
                </div>
            </motion.div>

            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-white/5 pointer-events-none rounded-[2rem]" />
        </motion.div>
    );
}
