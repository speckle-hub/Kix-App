import { motion } from "framer-motion";
import { User, Trophy, Share2 } from "lucide-react";

export function PlayerCard({ stats, name = "Kix Player", position = "ST", nationality = "🇬🇧" }) {
    // Stats display maps
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
            className="relative w-64 h-96 mx-auto perspective-1000"
        >
            {/* "FIFA" Style Card Container */}
            <motion.div
                animate={{
                    boxShadow: [
                        "0 0 20px rgba(57, 255, 20, 0.2)",
                        "0 0 40px rgba(57, 255, 20, 0.5)",
                        "0 0 20px rgba(57, 255, 20, 0.2)"
                    ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full h-full bg-[#111] rounded-[2rem] overflow-hidden border border-primary/20 flex flex-col items-center p-6 text-white"
                style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #050505 100%)',
                }}
            >
                {/* Rare Border Gradient Effect (Blinking/Pulsing) */}
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 border-2 border-primary/40 rounded-[2rem] pointer-events-none"
                />

                {/* Top Section: Rating & Position */}
                <div className="absolute top-8 left-6 flex flex-col items-center">
                    <span className="text-4xl font-condensed font-bold text-primary leading-none">
                        {Math.floor(Object.values(stats).reduce((a, b) => a + b, 0) / 5)}
                    </span>
                    <span className="text-sm font-bold opacity-60">{position}</span>
                    <span className="text-xl mt-1">{nationality}</span>
                </div>

                {/* Player Image Placeholder */}
                <div className="w-32 h-32 bg-white/5 rounded-full mt-4 flex items-center justify-center border border-white/10 backdrop-blur-md overflow-hidden">
                    <User size={64} className="text-white/20" />
                </div>

                {/* Player Name */}
                <h3 className="mt-4 text-2xl font-condensed font-bold tracking-tight uppercase border-b border-primary/30 pb-2 w-full text-center">
                    {name}
                </h3>

                {/* Bottom Section: Stats Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-auto w-full px-4 mb-4">
                    {displayStats.map((s) => (
                        <div key={s.label} className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/40">{s.label}</span>
                            <span className="text-base font-condensed font-bold">{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Rare Symbol & Share Button */}
                <div className="absolute bottom-4 right-6 flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(window.location.href);
                            alert("Profile link copied to clipboard!");
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

            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-white/5 pointer-events-none rounded-[2rem]" />
        </motion.div>
    );
}
