import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    doc, getDoc, onSnapshot, runTransaction,
    updateDoc, arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    MapPin, Clock, Users, Shield, ChevronLeft,
    Lock, CheckCircle, XCircle, Loader2, Crown,
    UserCheck, MessageSquare, Navigation, Share2, Bolt, Grass, Verified, Trophy
} from 'lucide-react';
import {
    RELIABILITY_ADJUSTMENTS,
    calculateNewReliability,
    XP_PER_MATCH,
    XP_FOR_HOSTING,
    evaluateBadges
} from '../lib/rpg';
import { ChatWindow } from './ChatWindow';
import { ReliabilityBadge } from './ReliabilityBadge';
import { haptics } from '../utils/haptics';

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'text-primary', bg: 'bg-primary/10' },
    locked: { label: 'Locked', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    completed: { label: 'Completed', color: 'text-white/40', bg: 'bg-white/5' },
    canceled: { label: 'Canceled', color: 'text-red-400', bg: 'bg-red-400/10' },
};

/**
 * RosterSlot - Refined for New Design
 */
function RosterSlot({ uid, isHost, canAction, onNoShow }) {
    const [name, setName] = useState('...');
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        if (!uid) return;
        getDoc(doc(db, 'users', uid)).then(d => {
            if (d.exists()) {
                const data = d.data();
                setName(data.name || 'Player');
                setUserData(data);
            }
        });
    }, [uid]);

    return (
        <div className="glass p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative">
                    {userData?.photoURL ? (
                        <img
                            src={userData.photoURL}
                            alt={name}
                            className="size-12 rounded-full object-cover ring-2 ring-primary/20"
                        />
                    ) : (
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-primary/40">person</span>
                        </div>
                    )}
                    {/* Reliability Indicator */}
                    <div
                        className={`absolute -bottom-1 -right-1 size-4 border-2 border-[#12230f] rounded-full ${(userData?.reliabilityScore || 100) >= 90 ? 'bg-green-500' :
                                (userData?.reliabilityScore || 100) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                        title={`Reliability: ${userData?.reliabilityScore || 100}%`}
                    />
                </div>
                <div>
                    <p className="font-bold text-sm text-white">{name}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                        {userData?.position || 'Player'} • {userData?.skillLevel || 'Beginner'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isHost && (
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-sm">
                        <span className="material-symbols-outlined text-primary text-xs">verified</span>
                        <span className="text-[10px] font-bold text-white/80">Host</span>
                    </div>
                )}
                {canAction && !isHost && (
                    <button
                        onClick={() => onNoShow(uid)}
                        className="p-1.5 hover:bg-red-500/10 text-red-400/50 hover:text-red-400 rounded-lg transition-colors"
                        title="Mark No-Show"
                    >
                        <XCircle size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

export function MatchDetails() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ hours: '00', mins: '00', secs: '00' });

    // Real-time Data
    useEffect(() => {
        if (!matchId) return;
        const unsub = onSnapshot(doc(db, 'matches', matchId), (snap) => {
            if (snap.exists()) {
                setMatch({ id: snap.id, ...snap.data() });
            } else {
                setError('Match not found.');
            }
            setLoading(false);
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });
        return unsub;
    }, [matchId]);

    // Countdown Timer Logic
    useEffect(() => {
        if (!match?.kickoffTime) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const kickoff = new Date(match.kickoffTime).getTime();
            const diff = kickoff - now;

            if (diff <= 0) {
                setTimeLeft({ hours: '00', mins: '00', secs: '00' });
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({
                    hours: hours.toString().padStart(2, '0'),
                    mins: mins.toString().padStart(2, '0'),
                    secs: secs.toString().padStart(2, '0')
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [match?.kickoffTime]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#12230f]">
            <Loader2 size={48} className="animate-spin text-primary mb-4" />
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Preparing Pitch...</p>
        </div>
    );

    if (error || !match) return (
        <div className="p-10 text-center min-h-screen bg-[#12230f]">
            <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <XCircle size={40} className="text-red-500" />
            </div>
            <p className="text-red-400 font-extrabold text-xl mb-4">{error || 'Match not found.'}</p>
            <button
                onClick={() => navigate('/matches')}
                className="px-8 py-3 rounded-full bg-primary text-background text-xs font-extrabold uppercase tracking-widest"
            >
                Return to Hub
            </button>
        </div>
    );

    const isHost = currentUser?.uid === match?.hostId;
    const isJoined = match?.joined_players?.includes(currentUser?.uid);
    const isOnWaitlist = match?.waitlist?.includes(currentUser?.uid);
    const joins = match?.joined_players || [];
    const capacity = match?.capacity || 10;
    const isFull = joins.length >= capacity;
    const statusCfg = STATUS_CONFIG[match?.status] || STATUS_CONFIG.open;

    // Check-in window
    const now = Date.now();
    const kickoffTs = match?.kickoffTime ? new Date(match.kickoffTime).getTime() : null;
    const checkinOpen = kickoffTs && now >= kickoffTs - 30 * 60 * 1000 && now < kickoffTs + 90 * 60 * 1000;
    const hasCheckedIn = match?.checkedIn?.includes(currentUser?.uid);
    const spotsLeft = Math.max(0, capacity - joins.length);

    // --- Actions ---
    const handleJoin = async () => {
        if (!currentUser) return;
        setActionLoading(true);
        try {
            const matchRef = doc(db, 'matches', matchId);
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(matchRef);
                if (!snap.exists()) throw new Error('Match not found');
                const data = snap.data();
                const players = data.joined_players || [];
                if (players.includes(currentUser.uid)) return;
                if (players.length >= data.capacity) {
                    haptics.success();
                    tx.update(matchRef, { waitlist: arrayUnion(currentUser.uid) });
                } else {
                    haptics.success();
                    tx.update(matchRef, {
                        joined_players: arrayUnion(currentUser.uid),
                        spotsLeft: data.capacity - players.length - 1,
                    });
                }
            });
        } catch (e) { console.error(e); }
        setActionLoading(false);
    };

    const handleLeave = async () => {
        setActionLoading(true);
        try {
            const matchRef = doc(db, 'matches', matchId);
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(matchRef);
                if (!snap.exists()) return;
                const data = snap.data();
                const players = (data.joined_players || []).filter(u => u !== currentUser.uid);
                const waitlist = data.waitlist || [];
                const promoted = waitlist[0];
                const newWaitlist = waitlist.slice(1);
                haptics.light();
                const newPlayers = promoted ? [...players, promoted] : players;
                tx.update(matchRef, {
                    joined_players: newPlayers,
                    waitlist: newWaitlist,
                    spotsLeft: data.capacity - newPlayers.length,
                });
            });
        } catch (e) { console.error(e); }
        setActionLoading(false);
    };

    const handleCheckin = async () => {
        setActionLoading(true);
        try {
            haptics.success();
            await updateDoc(doc(db, 'matches', matchId), {
                checkedIn: arrayUnion(currentUser.uid),
            });
        } catch (e) { console.error(e); }
        setActionLoading(false);
    };

    const handleNoShow = async (uid) => {
        if (!window.confirm('Mark this player as a no-show?')) return;
        setActionLoading(true);
        try {
            const userRef = doc(db, 'users', uid);
            await runTransaction(db, async (tx) => {
                const userSnap = await tx.get(userRef);
                if (!userSnap.exists()) return;
                const currentScore = userSnap.data().reliabilityScore || 100;
                tx.update(userRef, {
                    reliabilityScore: calculateNewReliability(currentScore, RELIABILITY_ADJUSTMENTS.NO_SHOW)
                });
                tx.update(doc(db, 'matches', matchId), {
                    noShows: arrayUnion(uid)
                });
            });
        } catch (e) { console.error(e); }
        setActionLoading(false);
    };

    const handleHostAction = async (action) => {
        setActionLoading(true);
        const updates = {
            lock: { status: 'locked' },
            unlock: { status: 'open' },
            complete: { status: 'completed', completedAt: new Date().toISOString() },
            cancel: { status: 'canceled', canceledAt: new Date().toISOString() },
        };
        try {
            if (action === 'complete') {
                const matchRef = doc(db, 'matches', matchId);
                await updateDoc(matchRef, updates.complete);
                const players = match.joined_players || [];
                const awardPromises = players.map(uid => {
                    const userRef = doc(db, 'users', uid);
                    return runTransaction(db, async (tx) => {
                        const userSnap = await tx.get(userRef);
                        if (!userSnap.exists()) return;
                        const userData = userSnap.data();
                        const stats = {
                            matchesCompleted: (userData.matchesCompleted || 0) + 1,
                            matchesHosted: (userData.matchesHosted || 0) + (uid === match.hostId ? 1 : 0),
                            reliabilityScore: userData.reliabilityScore || 100
                        };
                        const xp = (userData.xp || 0) + XP_PER_MATCH + (uid === match.hostId ? XP_FOR_HOSTING : 0);
                        tx.update(userRef, {
                            xp,
                            matchesCompleted: stats.matchesCompleted,
                            matchesHosted: stats.matchesHosted,
                            badges: evaluateBadges(userData.badges || [], stats)
                        });
                    });
                });
                await Promise.all(awardPromises);
            } else {
                await updateDoc(doc(db, 'matches', matchId), updates[action]);
            }
        } catch (e) { console.error(e); }
        setActionLoading(false);
    };

    return (
        <div className="bg-[#12230f] min-h-screen text-white font-display overflow-x-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 glass px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate('/matches')}
                    className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-sm font-extrabold uppercase tracking-widest text-white/80">Match Details</h1>
                <button className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
                    <Share2 size={18} />
                </button>
            </div>

            <main className="pb-40">
                {/* Hero section */}
                <div className="relative w-full h-80 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12230f] via-transparent to-transparent z-10" />
                    <img
                        src={match.image || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80"}
                        alt={match.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-6 left-4 z-20">
                        {spotsLeft <= 2 && spotsLeft > 0 && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-black text-[10px] font-bold mb-3 shadow-[0_0_15px_#38ff14]">
                                <Bolt size={10} className="mr-1 fill-black" /> FAST FILLING
                            </div>
                        )}
                        <h2 className="text-4xl font-black text-white leading-tight drop-shadow-lg mb-2">{match.title}</h2>
                        <div className="flex items-center gap-2 text-white/60">
                            <MapPin size={14} className="text-primary" />
                            <span className="text-xs font-bold">{match.location}</span>
                        </div>
                    </div>
                </div>

                {/* Countdown Timer */}
                <div className="px-4 -mt-8 relative z-30">
                    <div className="glass rounded-3xl p-6 flex flex-col items-center border-primary/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <span className="text-primary text-[10px] font-black tracking-[0.2em] uppercase mb-4 opacity-70">Kickoff In</span>
                        <div className="flex gap-4 sm:gap-8 items-center">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-black text-white tabular-nums">{timeLeft.hours}</span>
                                <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">Hours</span>
                            </div>
                            <div className="text-3xl font-black text-primary/40 pb-5">:</div>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-black text-white tabular-nums">{timeLeft.mins}</span>
                                <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">Mins</span>
                            </div>
                            <div className="text-3xl font-black text-primary/40 pb-5">:</div>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-black text-white tabular-nums">{timeLeft.secs}</span>
                                <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">Secs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Chips */}
                <div className="px-4 mt-8">
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                        {[
                            { icon: Users, label: `${match.format} Format` },
                            { icon: Trophy, label: match.skillLevel || 'Open' },
                            { icon: Grass, label: match.surface || 'Artificial' },
                            { icon: Shield, label: match.status.toUpperCase() }
                        ].map((chip, idx) => (
                            <div key={idx} className="flex-none glass px-5 py-2.5 rounded-full flex items-center gap-2 border border-primary/10">
                                <chip.icon size={14} className="text-primary" />
                                <span className="text-xs font-black uppercase tracking-wider text-white/80">{chip.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Location Details */}
                <div className="px-4 mt-8">
                    <div className="glass rounded-3xl p-4 flex gap-4 items-center border-white/5">
                        <div className="flex-1">
                            <h3 className="font-black text-sm uppercase tracking-widest text-primary/60 mb-1">Venue Info</h3>
                            <p className="text-xs font-bold text-white/40 leading-relaxed">
                                {match.locationDetails || `${match.location}. Check Gate B for entry.`}
                            </p>
                            <button
                                onClick={() => {
                                    const coords = match.locationCoords;
                                    const url = coords?.lat && coords?.lng
                                        ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.location)}`;
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }}
                                className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest mt-3 hover:opacity-70 transition-opacity"
                            >
                                <Navigation size={12} className="fill-primary" /> Get Directions
                            </button>
                        </div>
                        <div className="size-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 ring-4 ring-primary/5">
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsR7diEcPm4sw0Wa5cQsqxCtlsvVgglBBNwZMmxU3BVNZNuLYfgRYsbU_HfgkCaChSITjn2DcE8o3XbOWCFmABETyYH5dEoRgn7hlhU5fR_hcSN7Km2ePGuHjxoa2bXkjjyjgIjHAoCSNQJWRfh4YiIKbHOyWhk2XONasv2nfOY3HvOgk8zWt4nLxN5qzfwobGLmRtUTjJx4GsVz0tIDuFD0YQ68Pdwfhj6BP1DvJk0ZlcImqMuJiq6wTx9xuKFG4VQWrdPKawi3A"
                                className="w-full h-full object-cover grayscale opacity-60"
                                alt="Map View"
                            />
                        </div>
                    </div>
                </div>

                {/* Host Controls Section */}
                {isHost && (
                    <div className="px-4 mt-8">
                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 space-y-4">
                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                                <Crown size={12} className="fill-primary" /> Host Management
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {match.status === 'open' && (
                                    <button onClick={() => handleHostAction('lock')} disabled={actionLoading}
                                        className="h-11 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                        <Lock size={12} /> Lock
                                    </button>
                                )}
                                {match.status === 'locked' && (
                                    <button onClick={() => handleHostAction('unlock')} disabled={actionLoading}
                                        className="h-11 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                        <Lock size={12} /> Unlock
                                    </button>
                                )}
                                {['open', 'locked', 'in_progress'].includes(match.status) && (
                                    <button onClick={() => handleHostAction('complete')} disabled={actionLoading}
                                        className="h-11 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_#38ff1433]">
                                        <CheckCircle size={12} className="fill-black" /> Complete
                                    </button>
                                )}
                                {['open', 'locked'].includes(match.status) && (
                                    <button onClick={() => handleHostAction('cancel')} disabled={actionLoading}
                                        className="h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                                        <XCircle size={12} /> Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Roster Section */}
                <div className="px-4 mt-10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black tracking-tight text-white/90">Squad List</h3>
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {joins.length} / {capacity} Joined
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        {joins.length === 0 ? (
                            <div className="glass p-8 rounded-3xl text-center border-dashed border-white/10">
                                <p className="text-white/20 text-sm font-bold uppercase tracking-widest">No players yet. Be the first!</p>
                            </div>
                        ) : (
                            joins.map((uid) => (
                                <RosterSlot
                                    key={`player-${uid}`}
                                    uid={uid}
                                    isHost={uid === match.hostId}
                                    canAction={isHost && match.status === 'completed' && !match.noShows?.includes(uid)}
                                    onNoShow={handleNoShow}
                                />
                            ))
                        )}

                        {/* Empty Slots */}
                        {Array.from({ length: spotsLeft }).map((_, i) => (
                            <div key={`empty-${i}`} className="border-2 border-dashed border-white/5 p-4 rounded-xl flex items-center gap-4 bg-white/[0.02]">
                                <div className="size-12 rounded-full flex items-center justify-center border-2 border-dashed border-white/10 text-white/10">
                                    <span className="material-symbols-outlined text-xl">person_add</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white/10 italic">Empty Slot</p>
                                    <p className="text-[10px] text-white/5 font-black uppercase tracking-widest">Open for Recruit</p>
                                </div>
                            </div>
                        ))}

                        {/* Waitlist Section */}
                        {(match.waitlist?.length || 0) > 0 && (
                            <div className="mt-6 space-y-4">
                                <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                    <Clock size={12} /> Waitlist ({match.waitlist.length})
                                </h4>
                                {match.waitlist.map((uid) => (
                                    <RosterSlot
                                        key={`waitlist-${uid}`}
                                        uid={uid}
                                        isWaitlist
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 glass z-50 border-t border-white/5">
                <div className="max-w-md mx-auto flex gap-4">
                    {/* Chat Trigger */}
                    {isJoined && (
                        <button
                            onClick={() => setShowChat(true)}
                            className="size-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10 active:scale-95 transition-all shadow-inner"
                        >
                            <MessageSquare size={28} className="fill-primary/20" />
                        </button>
                    )}

                    {/* Main Action Button */}
                    <button
                        disabled={actionLoading || (isFull && !isJoined && !isOnWaitlist && !isHost && match.status === 'locked')}
                        onClick={isJoined ? handleLeave : (hasCheckedIn ? null : (checkinOpen ? handleCheckin : handleJoin))}
                        className={`flex-1 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center transition-all active:scale-[0.98] shadow-lg ${isJoined
                                ? (checkinOpen && !hasCheckedIn ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-white/5 text-white/60 border border-white/10')
                                : (isFull ? 'bg-yellow-500 text-black shadow-yellow-500/20' : 'bg-primary text-black shadow-primary/30')
                            }`}
                    >
                        {actionLoading ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                {checkinOpen && isJoined && !hasCheckedIn && "CHECK IN NOW"}
                                {hasCheckedIn && "CHECKED IN ✓"}
                                {isJoined && !checkinOpen && "LEAVE MATCH"}
                                {!isJoined && !isFull && !isOnWaitlist && "JOIN MATCH"}
                                {!isJoined && isFull && !isOnWaitlist && "JOIN WAITLIST"}
                                {isOnWaitlist && "ON WAITLIST"}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Chat Window Overlay */}
            <AnimatePresence>
                {showChat && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowChat(false)}
                            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 h-[85vh] z-[60] bg-[#12230f] border-t border-white/10 rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                        >
                            <ChatWindow
                                type="matches"
                                id={matchId}
                                title={match.title}
                                onClose={() => setShowChat(false)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
