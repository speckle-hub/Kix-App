import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    ChevronLeft, Loader2, MapPin, Clock,
    Users, Shield, Tag, X, Bolt, Trophy,
    Settings, Calendar, Hash, XCircle
} from 'lucide-react';
import { haptics } from '../utils/haptics';

const FORMATS = ['5v5', '7v7', '8v8', '11v11'];
const SKILL_LEVELS = ['Casual', 'Mid', 'Elite'];
const TAGS = [
    { id: 'mixed', label: 'Mixed', icon: 'group' },
    { id: 'competitive', label: 'Competitive', icon: 'emoji_events' },
    { id: 'referee', label: 'Referee', icon: 'shield' },
    { id: 'showers', label: 'Showers', icon: 'shower' }
];

export function CreateMatch() {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const locationInfo = useLocation();
    const prefill = locationInfo.state?.prefill || {};

    const [form, setForm] = useState({
        title: prefill.title || '',
        location: prefill.location || '',
        locationDetails: prefill.locationDetails || '',
        kickoffTime: prefill.kickoffTime || '',
        format: prefill.format || '5v5',
        skillLevel: prefill.skillLevel || 'Mid',
        capacity: prefill.capacity || 10,
        tags: prefill.tags || [],
        notes: prefill.notes || '',
        surface: prefill.surface || 'Artificial',
        price: prefill.price || 0
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (key, val) => {
        haptics.light();
        setForm(prev => ({ ...prev, [key]: val }));
    };

    const toggleTag = (tagId) => {
        haptics.light();
        setForm(prev => ({
            ...prev,
            tags: prev.tags.includes(tagId)
                ? prev.tags.filter(t => t !== tagId)
                : [...prev.tags, tagId]
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!form.title.trim() || !form.location.trim() || !form.kickoffTime) {
            setError('Please fill in title, location, and kickoff time.');
            haptics.error();
            return;
        }

        setSaving(true);
        setError('');

        try {
            const matchData = {
                ...form,
                capacity: Number(form.capacity),
                price: Number(form.price),
                hostId: currentUser.uid,
                hostName: userData?.name || 'Unknown',
                hostPhoto: userData?.photoURL || '',
                joined_players: [currentUser.uid],
                waitlist: [],
                checkedIn: [],
                spotsLeft: Number(form.capacity) - 1,
                status: 'open',
                createdAt: new Date().toISOString(),
                fromRequestId: locationInfo.state?.fromRequestId || null,
            };

            const docRef = await addDoc(collection(db, 'matches'), matchData);
            haptics.success();
            navigate(`/matches/${docRef.id}`);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to create match.');
            haptics.error();
        } finally {
            setSaving(false);
        }
    };

    // Helper to calculate progress based on filled fields
    const filledCount = [form.title, form.location, form.kickoffTime].filter(Boolean).length;
    const progressPercent = Math.max(10, (filledCount / 3) * 100);

    return (
        <div className="bg-[#12230f] min-h-screen text-white font-display overflow-x-hidden">
            {/* Top App Bar */}
            <header className="sticky top-0 z-50 glass px-4 py-4 border-b border-white/10">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <button
                        onClick={() => navigate('/matches')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <h1 className="text-sm font-extrabold uppercase tracking-widest text-white/80">Host Match</h1>
                    <button className="text-primary text-xs font-bold px-3 py-1">Drafts</button>
                </div>
            </header>

            <main className="max-w-md mx-auto pb-44 px-4 pt-6 space-y-8">
                {/* Progress Stepper */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Match Details</span>
                        <span className="text-primary text-[10px] font-black uppercase tracking-wider">
                            {progressPercent < 100 ? "In Progress" : "Ready to Kickoff"}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-primary rounded-full shadow-[0_0_10px_#38ff14]"
                        />
                    </div>
                </div>

                {/* Section 1: Basics */}
                <section className="space-y-4">
                    <h2 className="text-lg font-black flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_#38ff14]"></span>
                        The Basics
                    </h2>
                    <div className="glass shadow-2xl p-5 rounded-3xl space-y-5 border-white/5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Match Title</label>
                            <input
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/30 text-sm text-white placeholder:text-white/20 transition-all outline-none"
                                placeholder="e.g. Tuesday Night Wembley"
                                type="text"
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Location / Pitch</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">location_on</span>
                                <input
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-primary/30 text-sm text-white placeholder:text-white/20 transition-all outline-none"
                                    placeholder="Search for pitch or city"
                                    type="text"
                                    value={form.location}
                                    onChange={e => set('location', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Game Mechanics */}
                <section className="space-y-4">
                    <h2 className="text-lg font-black flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_#38ff14]"></span>
                        Game Mechanics
                    </h2>
                    <div className="glass shadow-2xl p-6 rounded-3xl space-y-7 border-white/5">
                        {/* Format Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Match Format</label>
                            <div className="flex flex-wrap gap-2">
                                {FORMATS.map(f => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => set('format', f)}
                                        className={`px-6 py-2.5 rounded-full border font-black text-xs transition-all active:scale-95 ${form.format === f
                                                ? 'border-primary bg-primary text-black shadow-[0_0_15px_rgba(56,255,20,0.3)]'
                                                : 'border-white/10 bg-white/5 text-white/40 hover:border-primary/50'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Capacity Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Player Capacity</label>
                                <span className="text-2xl font-black text-primary drop-shadow-sm">{form.capacity} Players</span>
                            </div>
                            <div className="relative pt-1">
                                <input
                                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                                    max="22" min="4" step="2"
                                    type="range"
                                    value={form.capacity}
                                    onChange={e => set('capacity', e.target.value)}
                                />
                                <style>
                                    {`
                                        input[type="range"]::-webkit-slider-thumb {
                                            -webkit-appearance: none;
                                            appearance: none;
                                            width: 28px;
                                            height: 28px;
                                            background: #38ff14;
                                            cursor: pointer;
                                            border-radius: 50%;
                                            border: 5px solid #12230f;
                                            box-shadow: 0 0 15px rgba(56, 255, 20, 0.5);
                                            transition: all 0.2s;
                                        }
                                        input[type="range"]::-webkit-slider-thumb:hover {
                                            transform: scale(1.1);
                                        }
                                    `}
                                </style>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-[0.1em]">
                                <span>4 MIN</span>
                                <span>22 MAX</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Logistics */}
                <section className="space-y-4">
                    <h2 className="text-lg font-black flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_#38ff14]"></span>
                        Logistics & Skill
                    </h2>
                    <div className="glass shadow-2xl p-6 rounded-3xl space-y-7 border-white/5">
                        {/* Time Picker */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Kickoff Time</label>
                            <div className="relative group">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10" />
                                <input
                                    type="datetime-local"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-primary/30 text-sm text-white transition-all outline-none [color-scheme:dark]"
                                    value={form.kickoffTime}
                                    onChange={e => set('kickoffTime', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Skill Level */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Skill Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {SKILL_LEVELS.map(lvl => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => set('skillLevel', lvl)}
                                        className={`py-3.5 rounded-2xl border font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 ${form.skillLevel === lvl
                                                ? 'border-primary/50 bg-primary/20 text-primary shadow-inner'
                                                : 'border-white/5 bg-white/5 text-white/30'
                                            }`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-[10px] font-bold transition-all active:scale-95 ${form.tags.includes(tag.id)
                                                ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_10px_rgba(56,255,20,0.1)]'
                                                : 'bg-white/5 border-white/5 text-white/40'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{tag.icon}</span>
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
                        <XCircle size={18} className="text-red-500 shrink-0" />
                        <p className="text-red-400 text-xs font-bold">{error}</p>
                    </div>
                )}
            </main>

            {/* Bottom Fixed Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#12230f] via-[#12230f]/95 to-transparent z-50">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full bg-primary py-5 rounded-3xl text-black font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(56,255,20,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Bolt size={18} className="fill-black" />}
                        {saving ? "Creating Match..." : "Create Match"}
                    </button>
                    <p className="text-center text-[10px] text-white/20 mt-5 uppercase font-black tracking-[0.3em]">
                        By creating you agree to the Fair Play policy
                    </p>
                </div>
            </div>
        </div>
    );
}
