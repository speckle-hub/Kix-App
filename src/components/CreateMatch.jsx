import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { ChevronLeft, Loader2, MapPin, Clock, Users, Shield, Tag } from 'lucide-react';

const FORMATS = ['5v5', '7v7', '11v11'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
const TAGS = ['Mixed', 'Women Only', 'Competitive', 'Casual', 'Needs Players'];

function FieldGroup({ label, icon: Icon, children }) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                <Icon size={10} /> {label}
            </label>
            {children}
        </div>
    );
}

function ChipSelect({ options, value, onChange }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${value === opt
                        ? 'bg-primary text-background'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

function MultiChipSelect({ options, values, onChange }) {
    const toggle = (opt) => {
        onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
    };
    return (
        <div className="flex gap-2 flex-wrap">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${values.includes(opt)
                        ? 'bg-primary text-background'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

export function CreateMatch() {
    const location = useLocation();
    const prefill = location.state?.prefill || {};

    const [form, setForm] = useState({
        title: prefill.title || '',
        location: prefill.location || '',
        kickoffTime: prefill.kickoffTime || '',
        format: prefill.format || '5v5',
        skillLevel: prefill.skillLevel || 'Intermediate',
        capacity: prefill.capacity || 10,
        tags: prefill.tags || [],
        notes: prefill.notes || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.location.trim() || !form.kickoffTime) {
            setError('Please fill in title, location, and kickoff time.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const docRef = await addDoc(collection(db, 'matches'), {
                ...form,
                capacity: Number(form.capacity),
                hostId: currentUser.uid,
                hostName: userData?.name || 'Unknown',
                joined_players: [currentUser.uid],
                waitlist: [],
                checkedIn: [],
                spotsLeft: Number(form.capacity) - 1,
                status: 'open',
                createdAt: new Date().toISOString(),
                fromRequestId: location.state?.fromRequestId || null,
            });
            navigate(`/matches/${docRef.id}`);
        } catch (err) {
            setError(err.message || 'Failed to create match.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 pb-32 space-y-6"
        >
            <button
                onClick={() => navigate('/matches')}
                className="flex items-center gap-2 text-white/40 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors"
            >
                <ChevronLeft size={16} /> Back
            </button>

            <div>
                <h1 className="text-3xl font-condensed">Create Match</h1>
                <p className="text-white/40 text-sm uppercase tracking-widest font-bold mt-1">Set up your game</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <FieldGroup label="Match Title" icon={Tag}>
                    <input
                        type="text"
                        placeholder="e.g. Sunday Showdown at Hackney"
                        value={form.title}
                        onChange={e => set('title', e.target.value)}
                        className="w-full bg-secondary/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </FieldGroup>

                <FieldGroup label="Location / Pitch" icon={MapPin}>
                    <input
                        type="text"
                        placeholder="e.g. Hackney Marshes, Pitch 4"
                        value={form.location}
                        onChange={e => set('location', e.target.value)}
                        className="w-full bg-secondary/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </FieldGroup>

                <FieldGroup label="Kickoff Time" icon={Clock}>
                    <input
                        type="datetime-local"
                        value={form.kickoffTime}
                        onChange={e => set('kickoffTime', e.target.value)}
                        className="w-full bg-secondary/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                    />
                </FieldGroup>

                <FieldGroup label="Format" icon={Users}>
                    <ChipSelect options={FORMATS} value={form.format} onChange={v => {
                        const caps = { '5v5': 10, '7v7': 14, '11v11': 22 };
                        set('format', v);
                        set('capacity', caps[v]);
                    }} />
                </FieldGroup>

                <FieldGroup label="Skill Level" icon={Shield}>
                    <ChipSelect options={SKILL_LEVELS} value={form.skillLevel} onChange={v => set('skillLevel', v)} />
                </FieldGroup>

                <FieldGroup label="Player Capacity" icon={Users}>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={4} max={22} step={1}
                            value={form.capacity}
                            onChange={e => set('capacity', e.target.value)}
                            className="flex-1 accent-primary"
                        />
                        <span className="text-primary font-bold text-lg w-8 text-center">{form.capacity}</span>
                    </div>
                </FieldGroup>

                <FieldGroup label="Tags" icon={Tag}>
                    <MultiChipSelect options={TAGS} values={form.tags} onChange={v => set('tags', v)} />
                </FieldGroup>

                <FieldGroup label="Notes (optional)" icon={Tag}>
                    <textarea
                        placeholder="Any extra info for players..."
                        value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        rows={3}
                        className="w-full bg-secondary/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    />
                </FieldGroup>

                {error && (
                    <p className="text-red-400 text-sm font-bold text-center">{error}</p>
                )}

                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                    {saving ? 'CREATING...' : 'CREATE MATCH ⚽'}
                </Button>
            </form>
        </motion.div>
    );
}
