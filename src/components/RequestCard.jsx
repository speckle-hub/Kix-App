import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, runTransaction, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Zap, Heart, ArrowRight, Timer } from 'lucide-react';

// Compute human-readable countdown from expiresAt ISO string
function useCountdown(expiresAt) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const tick = () => {
            const diff = new Date(expiresAt) - Date.now();
            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('Expired');
                return;
            }
            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
        };
        tick();
        const id = setInterval(tick, 30_000); // update every 30s
        return () => clearInterval(id);
    }, [expiresAt]);

    return { timeLeft, isExpired };
}

export function RequestCard({ request, onConverted }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const {
        id,
        creatorId,
        creatorName,
        location,
        desiredTime,
        format,
        skillLevel,
        notes,
        expiresAt,
        interestedUsers = [],
        status,
    } = request;

    const { timeLeft, isExpired } = useCountdown(expiresAt);
    const isCreator = currentUser?.uid === creatorId;
    const isInterested = currentUser && interestedUsers.includes(currentUser.uid);

    // Minimum players needed for this format
    const minPlayers = format === '5v5' ? 10 : format === '7v7' ? 14 : 22;
    const canConvert = isCreator && interestedUsers.length >= minPlayers - 1; // creator counts as 1

    // Optimistic state for interested list
    const [optimisticInterested, setOptimisticInterested] = useState(interestedUsers);
    const [interestLoading, setInterestLoading] = useState(false);
    const [converting, setConverting] = useState(false);

    // Sync if parent data changes
    useEffect(() => { setOptimisticInterested(interestedUsers); }, [interestedUsers]);

    const handleInterest = useCallback(async () => {
        if (!currentUser || isExpired || status !== 'open') return;
        const ref = doc(db, 'matchRequests', id);
        const wasInterested = optimisticInterested.includes(currentUser.uid);

        // Optimistic update
        const next = wasInterested
            ? optimisticInterested.filter(u => u !== currentUser.uid)
            : [...optimisticInterested, currentUser.uid];
        setOptimisticInterested(next);
        setInterestLoading(true);

        try {
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists()) throw new Error('Request not found');
                const data = snap.data();
                if (data.status !== 'open') throw new Error('Request no longer open');
                tx.update(ref, {
                    interestedUsers: wasInterested
                        ? arrayRemove(currentUser.uid)
                        : arrayUnion(currentUser.uid),
                });
            });
        } catch (err) {
            // Rollback on failure
            console.error('Interest toggle failed:', err);
            setOptimisticInterested(interestedUsers);
        } finally {
            setInterestLoading(false);
        }
    }, [currentUser, id, isExpired, status, optimisticInterested, interestedUsers]);

    const handleConvert = useCallback(async () => {
        if (!isCreator || isExpired || status !== 'open') return;
        setConverting(true);
        try {
            // Navigate to CreateMatch with prefill data — conversion happens after match creation
            navigate('/matches/create', {
                state: {
                    prefill: {
                        title: `${format} in ${location}`,
                        location,
                        kickoffTime: desiredTime,
                        format,
                        skillLevel,
                        notes,
                    },
                    fromRequestId: id,
                }
            });
        } catch (err) {
            console.error('Conversion failed:', err);
            setConverting(false);
        }
    }, [isCreator, isExpired, status, navigate, format, location, desiredTime, skillLevel, notes, id]);

    const expired = isExpired || status === 'expired' || status === 'converted';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-3xl border p-5 space-y-4 transition-all ${expired
                    ? 'bg-white/2 border-white/5 opacity-50'
                    : 'bg-secondary/50 border-white/10 hover:border-primary/20'
                }`}
        >
            {/* Status overlay for converted */}
            {status === 'converted' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/60 z-10">
                    <span className="text-primary font-bold text-sm uppercase tracking-widest">Match Created ✓</span>
                </div>
            )}

            {/* Header row */}
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">
                            {creatorName}
                        </span>
                        {isCreator && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase rounded-full">You</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                        <MapPin size={13} className="text-primary flex-shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>

                {/* Expiry countdown */}
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${isExpired ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/30'
                    }`}>
                    <Timer size={10} />
                    {timeLeft}
                </div>
            </div>

            {/* Details row */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Clock size={12} className="text-primary" />
                    {new Date(desiredTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Users size={12} className="text-primary" />
                    {format}
                </div>
                {skillLevel && skillLevel !== 'Any' && (
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <Zap size={12} className="text-primary" />
                        {skillLevel}
                    </div>
                )}
            </div>

            {notes && (
                <p className="text-white/30 text-xs leading-relaxed">{notes}</p>
            )}

            {/* Interest bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-white/30">
                    <span>{optimisticInterested.length} interested</span>
                    <span>Need {minPlayers - 1} more</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        animate={{ width: `${Math.min(100, (optimisticInterested.length / (minPlayers - 1)) * 100)}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full bg-primary rounded-full"
                    />
                </div>
            </div>

            {/* Action buttons */}
            {!expired && (
                <div className="flex gap-2">
                    {!isCreator && (
                        <button
                            onClick={handleInterest}
                            disabled={interestLoading}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all ${isInterested
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'
                                }`}
                        >
                            <Heart size={14} className={isInterested ? 'fill-primary' : ''} />
                            {isInterested ? "I'm In" : "Interested"}
                        </button>
                    )}

                    {isCreator && (
                        <button
                            onClick={handleConvert}
                            disabled={!canConvert || converting}
                            title={!canConvert ? `Need ${minPlayers - 1 - optimisticInterested.length} more interested players` : 'Convert to official match'}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all ${canConvert
                                    ? 'bg-primary text-background hover:bg-primary/80'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                                }`}
                        >
                            <ArrowRight size={14} />
                            {canConvert ? 'Create Match' : `${minPlayers - 1 - optimisticInterested.length} more needed`}
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
