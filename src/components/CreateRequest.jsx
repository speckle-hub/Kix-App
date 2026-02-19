import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, MapPin, Clock, Users, Zap } from 'lucide-react';
import { Button } from './Button';

const FORMATS = ['5v5', '7v7', '11v11'];
const SKILL_LEVELS = ['Any', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];

// Guard: max 2 active requests per user
const MAX_ACTIVE_REQUESTS = 2;

export function CreateRequest() {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        location: '',
        desiredTime: '',
        format: '5v5',
        skillLevel: 'Any',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeCount, setActiveCount] = useState(null); // null = loading

    // Check how many active requests the user already has
    useEffect(() => {
        if (!currentUser) return;
        const now = new Date().toISOString();
        const q = query(
            collection(db, 'matchRequests'),
            where('creatorId', '==', currentUser.uid),
            where('status', '==', 'open'),
        );
        getDocs(q).then(snap => {
            // Filter client-side for non-expired (index only has status)
            const active = snap.docs.filter(d => d.data().expiresAt > now);
            setActiveCount(active.length);
        }).catch(() => setActiveCount(0));
    }, [currentUser]);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.location.trim()) return setError('Location is required.');
        if (!form.desiredTime) return setError('Desired time is required.');

        const kickoff = new Date(form.desiredTime);
        if (kickoff <= new Date()) return setError('Desired time must be in the future.');

        if (activeCount >= MAX_ACTIVE_REQUESTS) {
            return setError(`You already have ${MAX_ACTIVE_REQUESTS} active requests. Wait for one to expire or be converted.`);
        }

        setSubmitting(true);
        try {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            await addDoc(collection(db, 'matchRequests'), {
                creatorId: currentUser.uid,
                creatorName: userData?.name || 'Unknown',
                location: form.location.trim(),
                desiredTime: kickoff.toISOString(),
                format: form.format,
                skillLevel: form.skillLevel,
                notes: form.notes.trim(),
                expiresAt,
                interestedUsers: [],
                convertedMatchId: null,
                status: 'open',
                createdAt: new Date().toISOString(),
            });
            navigate('/matches?tab=requests');
        } catch (err) {
            console.error('Error creating request:', err);
            setError('Failed to post request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const minPlayers = form.format === '5v5' ? 10 : form.format === '7v7' ? 14 : 22;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 pb-32 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-condensed">Post a Request</h2>
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Expires in 24 hours</p>
                </div>
            </div>

            {activeCount >= MAX_ACTIVE_REQUESTS && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-orange-400 text-sm">
                    You have {MAX_ACTIVE_REQUESTS} active requests. Wait for one to expire or be converted before posting another.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Location */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <MapPin size={12} /> Location
                    </label>
                    <input
                        type="text"
                        value={form.location}
                        onChange={e => set('location', e.target.value)}
                        placeholder="e.g. Brooklyn, Prospect Park"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                        maxLength={100}
                    />
                </div>

                {/* Desired Time */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Clock size={12} /> Desired Time
                    </label>
                    <input
                        type="datetime-local"
                        value={form.desiredTime}
                        onChange={e => set('desiredTime', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>

                {/* Format */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Users size={12} /> Format
                    </label>
                    <div className="flex gap-2">
                        {FORMATS.map(f => (
                            <button
                                key={f} type="button"
                                onClick={() => set('format', f)}
                                className={`flex-1 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all ${form.format === f
                                        ? 'bg-primary text-background'
                                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <p className="text-white/20 text-xs">Needs {minPlayers} players total</p>
                </div>

                {/* Skill Level */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Zap size={12} /> Skill Level
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {SKILL_LEVELS.map(s => (
                            <button
                                key={s} type="button"
                                onClick={() => set('skillLevel', s)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${form.skillLevel === s
                                        ? 'bg-primary text-background'
                                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Notes (optional)</label>
                    <textarea
                        value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        placeholder="Any extra details..."
                        rows={3}
                        maxLength={200}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={submitting || activeCount >= MAX_ACTIVE_REQUESTS}
                    className="w-full flex justify-center items-center gap-2"
                >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    POST REQUEST
                </Button>
            </form>
        </motion.div>
    );
}
