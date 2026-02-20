import React, { useState, useEffect } from 'react';
import { PlayerCard } from './PlayerCard';
import { MatchHistory } from './MatchHistory';
import { SkillBadges } from './SkillBadges';
import { motion } from 'framer-motion';
import { haptics } from '../utils/haptics';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './Button';
import { Loader2, Check, LogOut, Zap, Target, Shield, Star, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BadgeGrid } from './BadgeGrid';
import { RadarSkills } from './RadarSkills';
import {
    getStatCap,
    clampStatsToCap,
    xpToLevel,
    calculateOVR,
    getProgressToNextLevel,
    getXPForNextLevel
} from '../lib/rpg';
import { ReliabilityBadge } from './ReliabilityBadge';

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
                <div
                    className={`h-full rounded-full ${value >= cap ? 'bg-yellow-400' : 'bg-primary'}`}
                    style={{
                        width: `${pct}%`,
                        ...(value < cap ? { boxShadow: '0 0 6px #39FF14' } : {})
                    }}
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
        haptics.medium();
        setSaving(true);
        setSaved(false);
        const clampedStats = clampStatsToCap(stats, level);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { stats: clampedStats, position });
            setUserData(prev => ({ ...prev, stats: clampedStats, position }));
            setSaved(true);
            haptics.success();
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving stats:", error);
            haptics.error();
        } finally {
            setSaving(false);
        }
    };

    const ovr = calculateOVR(stats, position);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-8 pb-32"
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-condensed">{userData?.displayName || userData?.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                        <ReliabilityBadge score={userData?.reliabilityScore || 100} />
                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest border-l border-white/10 pl-3">
                            OVR {ovr} · Level {level}
                        </span>
                    </div>
                </div>
                <button
                    onClick={async () => { await logout(); window.location.href = '/'; }}
                    className="text-white/20 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">XP Progress</span>
                    <span className="text-xs font-bold text-primary">
                        {xp} / {getXPForNextLevel(level)} XP
                    </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-primary shadow-[0_0_10px_#39FF14]"
                        style={{ width: `${getProgressToNextLevel(xp)}%` }}
                    />
                </div>
            </div>

            {/* Stats & Radar Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-xl font-condensed tracking-wide">Skill Radar</h3>
                    <RadarSkills skills={stats} />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h3 className="text-xl font-condensed tracking-wide">Attributes</h3>
                        <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 px-4 text-[10px] tracking-widest">
                            {saving ? <Loader2 size={12} className="animate-spin" /> : "SAVE CHANGES"}
                        </Button>
                    </div>
                    <div className="bg-secondary/30 rounded-3xl p-5 border border-white/5 space-y-4">
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
            </div>

            {/* Badges */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-condensed tracking-wide">Achievements</h3>
                    {import.meta.env.DEV && (
                        <button
                            onClick={async () => {
                                const newXP = xp + 50;
                                const userRef = doc(db, 'users', currentUser.uid);
                                await updateDoc(userRef, { xp: newXP });
                                setUserData(prev => ({ ...prev, xp: newXP }));
                            }}
                            className="text-[10px] font-bold text-primary hover:underline"
                        >
                            +50 XP (DEV)
                        </button>
                    )}
                </div>
                <BadgeGrid earnedBadges={userData?.badges || []} />
            </div>

            <MatchHistory />
            <div className="pb-10" />
        </motion.div>
    );
}
