import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { haptics } from '../utils/haptics';
import { useNavigate } from 'react-router-dom';
import {
    Settings, Share2, Verified, SportsSoccer, EmojiEvents,
    Bolt, MilitaryTech, ShieldWithHeart, Air,
    ChevronRight, Loader2, LogOut, Trophy,
    Star, Target, Shield, Zap
} from 'lucide-react';
import {
    xpToLevel,
    calculateOVR,
    getProgressToNextLevel,
    getXPForNextLevel,
    getReliabilityTier
} from '../lib/rpg';
import { BADGES } from '../constants/badges';

export function ProfilePage() {
    const { userData, currentUser, setUserData, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const xp = userData?.xp || 0;
    const level = xpToLevel(xp);
    const progress = getProgressToNextLevel(xp);
    const nextLevelXP = getXPForNextLevel(level);
    const reliabilityScore = userData?.reliabilityScore || 100;

    // UI-specific color mapping as requested
    const getReliabilityColor = (score) => {
        if (score >= 90) return 'text-primary';
        if (score >= 70) return 'text-yellow-400';
        return 'text-red-500';
    };
    const reliabilityColor = getReliabilityColor(reliabilityScore);

    const handleLogout = async () => {
        haptics.medium();
        await logout();
        navigate('/');
    };

    const handleShare = async () => {
        haptics.light();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Kix Profile',
                    text: `Check out my Kix profile! I'm Level ${level}.`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Profile link copied to clipboard!');
        }
    };

    // Calculate badges
    const earnedIds = new Set(userData?.badges?.map(b => b.id) || []);
    const badgeList = Object.values(BADGES);

    return (
        <div className="bg-[#12230f] min-h-screen text-white font-display overflow-x-hidden">
            {/* Header / Top Bar */}
            <div className="flex items-center justify-between p-4 pt-6 max-w-md mx-auto relative z-10">
                <button
                    onClick={() => navigate('/settings')}
                    className="p-2 rounded-full glass-card text-primary transition-all active:scale-90"
                >
                    <Settings size={20} />
                </button>
                <h1 className="text-sm font-black tracking-[0.2em] uppercase text-white/80">Player Profile</h1>
                <button
                    onClick={handleShare}
                    className="p-2 rounded-full glass-card text-primary transition-all active:scale-90"
                >
                    <Share2 size={20} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="max-w-md mx-auto pb-32">
                {/* Profile Identity Section */}
                <div className="flex flex-col items-center px-4 py-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-transparent shadow-[0_0_20px_rgba(56,255,20,0.3)]">
                            <div className="w-full h-full rounded-full bg-background-dark overflow-hidden border-4 border-[#12230f]">
                                <img
                                    alt="User Profile"
                                    className="w-full h-full object-cover"
                                    src={userData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.name}`}
                                />
                            </div>
                        </div>
                        {userData?.tier === 'pro' && (
                            <div className="absolute bottom-0 right-0 bg-primary text-[#12230f] px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg border-2 border-[#12230f]">
                                <Verified size={12} className="fill-[#12230f]" /> PRO
                            </div>
                        )}
                    </div>

                    <div className="mt-5 text-center">
                        <h2 className="text-2xl font-black tracking-tight">{userData?.displayName || userData?.name}</h2>
                        <div className="flex items-center justify-center gap-2 mt-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                            <Shield size={10} className={`${reliabilityColor} fill-current`} />
                            <p className={`${reliabilityColor} text-[10px] font-bold tracking-widest uppercase`}>
                                Reliability: {reliabilityScore}%
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/profile/edit')}
                        className="mt-8 w-full max-w-[180px] bg-primary text-black font-black py-3.5 rounded-full hover:scale-105 transition-all active:scale-95 shadow-[0_5px_20px_rgba(56,255,20,0.4)] text-xs uppercase tracking-[0.15em]"
                    >
                        Edit Profile
                    </button>
                </div>

                {/* RPG Stats Section */}
                <div className="px-5 space-y-5">
                    {/* Level & XP Card */}
                    <div className="glass-card rounded-[2rem] p-7 relative overflow-hidden border border-white/10 shadow-2xl">
                        <div className="flex justify-between items-end mb-5">
                            <div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-1.5 ml-1">Current Status</p>
                                <h3 className="text-4xl font-black text-primary italic tracking-tight drop-shadow-sm">LEVEL {level}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black tracking-tight">
                                    {xp.toLocaleString()} <span className="text-white/20 italic">/ {nextLevelXP === Infinity ? 'MAX' : nextLevelXP.toLocaleString()} XP</span>
                                </p>
                            </div>
                        </div>
                        <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-primary rounded-full shadow-[0_0_15px_#38ff14]"
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                        {nextLevelXP !== Infinity && (
                            <p className="text-[10px] text-primary/60 mt-4 font-black flex items-center gap-1.5 uppercase tracking-wider">
                                <Bolt size={12} className="fill-primary/60" />
                                {(nextLevelXP - xp).toLocaleString()} XP more to reach Level {level + 1}
                            </p>
                        )}

                        {/* Background SVG Decoration */}
                        <div className="absolute top-[-20px] right-[-20px] text-primary/5 -rotate-12 opacity-20">
                            <Trophy size={140} />
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 hover:bg-white/[0.08] transition-colors">
                            <div className="flex items-center gap-3 mb-2.5">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Zap size={16} className="text-primary" />
                                </div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Matches</p>
                            </div>
                            <p className="text-3xl font-black">{userData?.matchesCompleted || 0}</p>
                            <p className="text-[10px] text-primary font-black mt-2 uppercase tracking-wider animate-pulse">+12 this week</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 hover:bg-white/[0.08] transition-colors">
                            <div className="flex items-center gap-3 mb-2.5">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Trophy size={16} className="text-primary" />
                                </div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Win Rate</p>
                            </div>
                            <p className="text-3xl font-black">68%</p>
                            <p className="text-[10px] text-white/20 font-black mt-2 uppercase tracking-wider">Coming Soon</p>
                        </div>
                    </div>

                    {/* Achievements Section */}
                    <div className="pt-6">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white/50 italic">Unlocked Badges</h3>
                            <button className="text-[10px] text-primary font-black uppercase tracking-widest border-b border-primary/30 pb-0.5">View All</button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {badgeList.slice(0, 3).map((badge) => {
                                const isEarned = earnedIds.has(badge.id);
                                return (
                                    <div key={badge.id} className="flex flex-col items-center gap-3 group">
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 relative overflow-hidden ${isEarned
                                            ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(56,255,20,0.15)] group-hover:scale-105'
                                            : 'bg-white/5 border-white/10 opacity-30 border-dashed'
                                            }`}>
                                            <span className={`text-3xl filter ${isEarned ? 'drop-shadow-[0_0_8px_rgba(56,255,20,0.5)]' : 'grayscale'}`}>
                                                {badge.icon}
                                            </span>
                                            {isEarned && (
                                                <div className="absolute -right-6 -bottom-6 w-12 h-12 bg-primary/10 rotate-45" />
                                            )}
                                        </div>
                                        <p className={`text-[9px] font-black text-center uppercase tracking-widest ${isEarned ? 'text-white' : 'text-white/20'}`}>
                                            {badge.name}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sign Out Button (Footer) */}
                    <div className="pt-10 flex justify-center">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-white/20 hover:text-red-500 transition-colors py-2 px-4 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <LogOut size={14} />
                            Sign Out Account
                        </button>
                    </div>
                </div>
            </div>

            <style>
                {`
                .glass-card {
                    background: linear-gradient(135deg, rgba(56, 255, 20, 0.05) 0%, rgba(56, 255, 20, 0) 100%);
                    backdrop-filter: blur(20px);
                }
                .neon-glow {
                    box-shadow: 0 0 15px rgba(56, 255, 20, 0.3);
                }
                `}
            </style>
        </div>
    );
}
