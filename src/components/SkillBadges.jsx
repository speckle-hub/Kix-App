import { Award, ShieldCheck, Flame, Star, Target, Crown, Zap, Heart } from "lucide-react";
import { motion } from "framer-motion";

// Badge definitions — these mirror the badgeDefinitions Firestore collection
const BADGE_DEFS = {
    team_player: { icon: ShieldCheck, label: "Team Player", color: "text-blue-400", desc: "Joined 5+ matches" },
    speedster: { icon: Flame, label: "Speedster", color: "text-orange-500", desc: "Pace stat 80+" },
    closer: { icon: Award, label: "Closer", color: "text-primary", desc: "Shooting stat 80+" },
    mvp: { icon: Star, label: "MVP", color: "text-yellow-400", desc: "Avg rating 4.5+" },
    captain: { icon: Crown, label: "Captain", color: "text-yellow-300", desc: "Hosted 3+ matches" },
    iron_lungs: { icon: Zap, label: "Iron Lungs", color: "text-cyan-400", desc: "10+ matches played" },
    playmaker: { icon: Target, label: "Playmaker", color: "text-purple-400", desc: "Passing stat 80+" },
    reliable: { icon: Heart, label: "Reliable", color: "text-green-400", desc: "Reliability score 90+" },
};

// Locked badge placeholder
function LockedBadge({ def }) {
    return (
        <div className="flex-shrink-0 flex flex-col items-center gap-2 bg-secondary/30 border border-white/5 rounded-2xl p-4 w-24 opacity-40 grayscale">
            <div className="p-2 rounded-full bg-white/5">
                <def.icon size={20} className="text-white/30" />
            </div>
            <span className="text-[10px] font-bold uppercase text-center text-white/30">{def.label}</span>
        </div>
    );
}

function EarnedBadge({ def }) {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 flex flex-col items-center gap-2 bg-secondary/50 border border-white/10 rounded-2xl p-4 w-24 group relative"
            title={def.desc}
        >
            <div className={`p-2 rounded-full bg-white/5 ${def.color} group-hover:scale-110 transition-transform`}>
                <def.icon size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase text-center text-white/60">{def.label}</span>
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {def.desc}
            </div>
        </motion.div>
    );
}

export function SkillBadges({ badges = [] }) {
    const earnedSet = new Set(badges);

    return (
        <div className="space-y-3">
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {Object.entries(BADGE_DEFS).map(([key, def]) =>
                    earnedSet.has(key)
                        ? <EarnedBadge key={key} def={def} />
                        : <LockedBadge key={key} def={def} />
                )}
            </div>
            <p className="text-white/20 text-xs text-center">
                {badges.length}/{Object.keys(BADGE_DEFS).length} badges earned
            </p>
        </div>
    );
}

/**
 * Badge awarding logic — call this on match completion.
 * Returns an array of new badge keys to award.
 */
export function computeNewBadges(userData, matchStats = {}) {
    const earned = new Set(userData.badges || []);
    const newBadges = [];
    const stats = userData.stats || {};
    const matchesPlayed = (userData.matchesPlayed || 0) + 1;
    const matchesHosted = userData.matchesHosted || 0;

    if (!earned.has('team_player') && matchesPlayed >= 5) newBadges.push('team_player');
    if (!earned.has('iron_lungs') && matchesPlayed >= 10) newBadges.push('iron_lungs');
    if (!earned.has('captain') && matchesHosted >= 3) newBadges.push('captain');
    if (!earned.has('speedster') && (stats.pace || 0) >= 80) newBadges.push('speedster');
    if (!earned.has('closer') && (stats.shooting || 0) >= 80) newBadges.push('closer');
    if (!earned.has('playmaker') && (stats.passing || 0) >= 80) newBadges.push('playmaker');
    if (!earned.has('reliable') && (userData.reliabilityScore || 100) >= 90) newBadges.push('reliable');
    if (!earned.has('mvp') && (matchStats.avgRating || 0) >= 4.5) newBadges.push('mvp');

    return newBadges;
}
