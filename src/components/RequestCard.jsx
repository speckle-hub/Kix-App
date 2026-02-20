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
            className={`relative glass-card rounded-2xl p-5 space-y-4 transition-all active:scale-[0.98] group overflow-hidden ${expired ? 'opacity-50' : ''}`}
        >
            {/* Status overlay for converted */}
            {status === 'converted' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-2">
                        <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_20px_#38ff1433]">
                            <span className="material-symbols-outlined text-primary text-2xl font-bold">check_circle</span>
                        </div>
                        <span className="text-primary font-extrabold text-xs uppercase tracking-[0.2em]">Match Created</span>
                    </div>
                </div>
            )}

            {/* Header row */}
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[10px] text-primary">person</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest truncate max-w-[120px]">
                            {creatorName}
                        </span>
                        {isCreator && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-extrabold uppercase rounded-full border border-primary/20">Host</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/80 text-sm font-bold">
                        <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                        <span className="truncate">{location}</span>
                    </div>
                </div>

                {/* Expiry countdown */}
                <div className={`flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-tight px-2.5 py-1 rounded-full flex-shrink-0 ml-2 border ${isExpired ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-white/40'
                    }`}>
                    <span className="material-symbols-outlined text-xs">timer</span>
                    {timeLeft}
                </div>
            </div>

            {/* Details row */}
            <div className="flex gap-4 flex-wrap pb-2 border-b border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 uppercase">
                    <span className="material-symbols-outlined text-xs text-primary">schedule</span>
                    {new Date(desiredTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 uppercase">
                    <span className="material-symbols-outlined text-xs text-primary">groups</span>
                    {format}
                </div>
                {skillLevel && skillLevel !== 'Any' && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 uppercase">
                        <span className="material-symbols-outlined text-xs text-primary">fitness_center</span>
                        {skillLevel}
                    </div>
                )}
            </div>

            {notes && (
                <p className="text-white/30 text-xs leading-relaxed italic line-clamp-2">"{notes}"</p>
            )}

            {/* Interest bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="text-white/40">{optimisticInterested.length} Interested</span>
                    <span className="text-primary">{minPlayers - 1 - optimisticInterested.length} More Needed</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        animate={{ width: `${Math.min(100, (optimisticInterested.length / (minPlayers - 1)) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-primary shadow-[0_0_10px_#38ff14]"
                    />
                </div>
            </div>

            {/* Action buttons */}
            {!expired && (
                <div className="flex gap-2 pt-2">
                    {!isCreator && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleInterest();
                            }}
                            disabled={interestLoading}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.1em] transition-all active:scale-95 ${isInterested
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'bg-white/5 text-white/40 hover:text-white border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-lg ${isInterested ? 'fill-1' : ''}`}>favorite</span>
                            {isInterested ? "I'm In" : "Interested"}
                        </button>
                    )}

                    {isCreator && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleConvert();
                            }}
                            disabled={!canConvert || converting}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-[0.1em] transition-all active:scale-95 ${canConvert
                                ? 'bg-primary text-background shadow-[0_0_20px_#38ff1444]'
                                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg font-bold">rocket_launch</span>
                            {canConvert ? 'Launch Match' : `${minPlayers - 1 - optimisticInterested.length} needed`}
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
