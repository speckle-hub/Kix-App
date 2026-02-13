import React, { useState, useEffect } from 'react';
import { PlayerCard } from './PlayerCard';
import { StatSliders } from './StatSliders';
import { MatchHistory } from './MatchHistory';
import { SkillBadges } from './SkillBadges';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './Button';
import { Loader2, Check, LogOut } from 'lucide-react';

export function ProfilePage() {
    const { userData, currentUser, setUserData, logout } = useAuth();
    const [stats, setStats] = useState({
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        physical: 50
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load stats from userData
    useEffect(() => {
        if (userData?.stats) {
            setStats(userData.stats);
        }
    }, [userData]);

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        setSaved(false);

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { stats });

            // Update local context state
            setUserData(prev => ({ ...prev, stats }));

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving stats:", error);
            alert("Failed to save stats. Please check your Firestore permissions.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 space-y-10"
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-condensed">Player Profile</h2>
                <button
                    onClick={logout}
                    className="text-white/20 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>

            <div className="relative group">
                <PlayerCard
                    stats={stats}
                    name={userData?.name || "KIX PLAYER"}
                    position={userData?.position || "ST"}
                    nationality={userData?.nationality || "🇬🇧"}
                />

                {/* Save Badge Overlay */}
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

            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <h3 className="text-xl font-condensed tracking-wide">Stats Center</h3>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="h-9 px-4 text-xs tracking-widest"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : "SAVE CHANGES"}
                    </Button>
                </div>
                <StatSliders stats={stats} setStats={setStats} />
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-condensed tracking-wide">Skill Badges</h3>
                <SkillBadges />
            </div>

            <MatchHistory />

            <div className="pb-10" />
        </motion.div>
    );
}
