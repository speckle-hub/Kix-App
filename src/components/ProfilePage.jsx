import React, { useState, useEffect } from 'react';
import { PlayerCard } from './PlayerCard';
import { MatchHistory } from './MatchHistory';
import { SkillBadges } from './SkillBadges';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './Button';
import { Loader2, Check, LogOut, Zap, Target, Shield, Star, ChevronDown } from 'lucide-react';
import { getStatCap, clampStatsToCap, xpToLevel, calculateOVR } from '../lib/rpg';
import { useNavigate } from 'react-router-dom';

const POSITIONS = ['ST', 'CF', 'CAM', 'CM', 'CDM', 'LW', 'RW', 'LB', 'RB', 'CB', 'GK'];

const STAT_ICONS = {
    pace: Zap,
    shooting: Target,
    passing: Shield,
    dribbling: Star,
    physical: Shield,
};

function StatBar({ label, value, cap, onChange, icon: Icon }) {
    const pct = (value / 99) * 100;
    const capPct = (cap / 99) * 100;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    <Icon size={14} className="text-primary" />
                    <span className="font-bold uppercase tracking-wider">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-primary font-bold">{value}</span>
                    <span className="text-white/20 text-xs">/ {cap}</span>
                </div>
            </div>
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                {/* Cap indicator */}
                <div
                    className="absolute top-0 h-full w-0.5 bg-white/20 z-10"
                    style={{ left: `${capPct}%` }}
                />
                {/* Value bar */}
                <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${value >= cap ? 'bg-yellow-400' : 'bg-primary'}`}
                    style={value < cap ? { boxShadow: '0 0 6px #39FF14' } : {}}
                />
            </div>
            <input
                type="range"
                min={10}
                max={cap}
                value={value}
                onChange={e => onChange(parseInt(e.target.value))}
                className="w-full h-1 opacity-0 absolute cursor-pointer"
                style={{ marginTop: '-12px' }}
            />
        </div>
    );
}

export function ProfilePage() {
    const { userData, currentUser, setUserData, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pace: 50, shooting: 50, passing: 50, dribbling: 50, physical: 50 });
    const [position, setPosition] = useState('ST');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const xp = userData?.xp || 0;
    const level = xpToLevel(xp);
    const statCap = getStatCap(level);

    useEffect(() => {
        if (userData?.stats) setStats(userData.stats);
        if (userData?.position) setPosition(userData.position);
    }, [userData]);

    const handleStatChange = (key, value) => {
        setStats(prev => ({ ...prev, [key]: Math.min(value, statCap) }));
    };

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        setSaved(false);
        const clampedStats = clampStatsToCap(stats, level);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { stats: clampedStats, position });
            setUserData(prev => ({ ...prev, stats: clampedStats, position }));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving stats:", error);
        } finally {
            setSaving(false);
        }
    };

    const ovr = calculateOVR(stats, position);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 pb-32">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-condensed">Player Profile</h2>
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-0.5">
                        OVR {ovr} · Level {level}
                    </p>
                </div>
                <button
                    onClick={async () => { await logout(); window.location.href = '/'; }}
                    className="text-white/20 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>

            {/* Player Card */}
            <div className="relative group">
                <PlayerCard
                    stats={stats}
                    name={userData?.name || "KIX PLAYER"}
                    position={position}
                    nationality={userData?.nationality || "🇬🇧"}
                    xp={xp}
                />
                {saved && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-4 -right-4 bg-primary text-background p-2 rounded-full shadow-lg"
                    >
                        <Check size={20} />
                    </motion.div>
                )}
            </div>

            {/* Position Selector */}
            <div className="space-y-3">
                <h3 className="text-xl font-condensed tracking-wide">Position</h3>
                <div className="flex gap-2 flex-wrap">
                    {POSITIONS.map(pos => (
                        <button
                            key={pos}
                            onClick={() => setPosition(pos)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${position === pos
                                    ? 'bg-primary text-background'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                                }`}
                        >
                            {pos}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-xl font-condensed tracking-wide">Attributes</h3>
                        <p className="text-white/30 text-xs mt-0.5">
                            Cap: <span className="text-primary font-bold">{statCap}</span> at Level {level}
                            {level < 20 && <span className="text-white/20"> · Level up to unlock higher caps</span>}
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 px-4 text-xs tracking-widest">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : "SAVE"}
                    </Button>
                </div>
                <div className="bg-secondary/30 rounded-3xl p-5 border border-white/5 space-y-5">
                    {Object.entries(stats).map(([key, value]) => (
                        <StatBar
                            key={key}
                            label={key}
                            value={value}
                            cap={statCap}
                            onChange={v => handleStatChange(key, v)}
                            icon={STAT_ICONS[key] || Star}
                        />
                    ))}
                </div>
            </div>

            {/* Badges */}
            <div className="space-y-4">
                <h3 className="text-xl font-condensed tracking-wide">Skill Badges</h3>
                <SkillBadges badges={userData?.badges} />
            </div>

            <MatchHistory />
            <div className="pb-10" />
        </motion.div>
    );
}
