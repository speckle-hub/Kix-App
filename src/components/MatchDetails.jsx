import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    doc, getDoc, onSnapshot, runTransaction,
    updateDoc, serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import {
    MapPin, Clock, Users, Shield, ChevronLeft,
    Lock, CheckCircle, XCircle, Loader2, Crown,
    AlertTriangle, UserCheck, MessageSquare, MessageCircle,
    UserX, ShieldAlert
} from 'lucide-react';
import {
    RELIABILITY_ADJUSTMENTS,
    calculateNewReliability
} from '../lib/rpg';
import { ChatWindow } from './ChatWindow';

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'text-primary', bg: 'bg-primary/10' },
    locked: { label: 'Locked', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    completed: { label: 'Completed', color: 'text-white/40', bg: 'bg-white/5' },
    canceled: { label: 'Canceled', color: 'text-red-400', bg: 'bg-red-400/10' },
};

function RosterSlot({ uid, index, isHost, canAction, onNoShow }) {
    const [name, setName] = useState('...');
    const [userData, setUserData] = useState(null);
    useEffect(() => {
        if (!uid) return;
        getDoc(doc(db, 'users', uid)).then(d => {
            if (d.exists()) {
                setName(d.data().name || 'Player');
                setUserData(d.data());
            }
        });
    }, [uid]);
    return (
        <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {index + 1}
            </div>
            <div className="flex-1">
                <span className="text-sm font-medium text-white/80">{name}</span>
                {userData && (
                    <div className="flex items-center gap-2 mt-0.5">
                        <ReliabilityBadge score={userData.reliabilityScore} size="sm" showLabel={false} />
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                {isHost && <Crown size={12} className="text-yellow-400" />}
                {canAction && !isHost && (
                    <button
                        onClick={() => onNoShow(uid)}
                        className="p-1.5 hover:bg-red-500/10 text-red-400/50 hover:text-red-400 rounded-lg transition-colors"
                        title="Mark No-Show"
                    >
                        <UserX size={14} />
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

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 size={40} className="animate-spin text-primary" />
        </div>
    );

    if (error || !match) return (
        <div className="p-6 text-center">
            <p className="text-red-400 font-bold">{error || 'Match not found.'}</p>
            <button onClick={() => navigate('/matches')} className="text-primary text-sm mt-4 hover:underline">
                Back to Matches
            </button>
        </div>
    );

    const isHost = currentUser?.uid === match.hostId;
    const isJoined = match.joined_players?.includes(currentUser?.uid);
    const isOnWaitlist = match.waitlist?.includes(currentUser?.uid);
    const isFull = (match.joined_players?.length || 0) >= match.capacity;
    const statusCfg = STATUS_CONFIG[match.status] || STATUS_CONFIG.open;

    // Check-in window: 30 min before kickoff
    const now = Date.now();
    const kickoff = match.kickoffTime ? new Date(match.kickoffTime).getTime() : null;
    const checkinOpen = kickoff && now >= kickoff - 30 * 60 * 1000 && now < kickoff + 90 * 60 * 1000;
    const hasCheckedIn = match.checkedIn?.includes(currentUser?.uid);

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
                if (players.includes(currentUser.uid)) return; // already joined
                if (players.length >= data.capacity) {
                    // Add to waitlist
                    tx.update(matchRef, { waitlist: arrayUnion(currentUser.uid) });
                } else {
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
                // Promote first waitlisted player
                const promoted = waitlist[0];
                const newWaitlist = waitlist.slice(1);
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
            await updateDoc(doc(db, 'matches', matchId), {
                checkedIn: arrayUnion(currentUser.uid),
            });
        } catch (e) { console.error(e); }
        setActionLoading(false);
    };

    const handleNoShow = async (uid) => {
        if (!window.confirm('Mark this player as a no-show? This will impact their reliability score.')) return;
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
            await updateDoc(doc(db, 'matches', matchId), updates[action]);
        } catch (e) { console.error(e); }
        setActionLoading(false);
    };

    const joined = match.joined_players?.length || 0;
    const progress = Math.min((joined / match.capacity) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 pb-32 space-y-6"
        >
            {/* Back */}
            <button
                onClick={() => navigate('/matches')}
                className="flex items-center gap-2 text-white/40 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors"
            >
                <ChevronLeft size={16} /> All Matches
            </button>

            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <h1 className="text-3xl font-condensed leading-tight">{match.title}</h1>
                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-sm">
                    <MapPin size={14} />
                    <span>{match.location}</span>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { icon: Clock, label: 'Kickoff', value: match.kickoffTime ? new Date(match.kickoffTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : match.time },
                    { icon: Users, label: 'Format', value: match.format || '—' },
                    { icon: Shield, label: 'Skill Level', value: match.skillLevel || 'Open' },
                    { icon: Crown, label: 'Host', value: match.hostName || 'Unknown' },
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-secondary/40 border border-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">
                            <Icon size={10} /> {label}
                        </div>
                        <p className="text-sm font-bold text-white">{value}</p>
                    </div>
                ))}
            </div>

            {/* Capacity Bar */}
            <div className="bg-secondary/40 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-white/40 uppercase tracking-widest">Players Joined</span>
                    <span className="text-white">{joined}<span className="text-white/30"> / {match.capacity}</span></span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-primary rounded-full"
                        style={{ boxShadow: '0 0 8px #39FF14' }}
                    />
                </div>
                {match.waitlist?.length > 0 && (
                    <p className="text-yellow-400 text-xs font-bold">
                        {match.waitlist.length} player{match.waitlist.length > 1 ? 's' : ''} on waitlist
                    </p>
                )}
            </div>

            {/* Roster */}
            <div className="bg-secondary/40 border border-white/5 rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Roster</h3>
                {(match.joined_players || []).length === 0 ? (
                    <p className="text-white/20 text-sm text-center py-4">No players yet. Be the first!</p>
                ) : (
                    (match.joined_players || []).map((uid, i) => (
                        <RosterSlot
                            key={uid}
                            uid={uid}
                            index={i}
                            isHost={uid === match.hostId}
                            canAction={isHost && match.status === 'completed' && !match.noShows?.includes(uid)}
                            onNoShow={handleNoShow}
                        />
                    ))
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                {/* Check-in */}
                {isJoined && checkinOpen && !hasCheckedIn && match.status !== 'canceled' && (
                    <Button
                        onClick={handleCheckin}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400"
                    >
                        <UserCheck size={16} />
                        CHECK IN NOW
                    </Button>
                )}
                {hasCheckedIn && (
                    <div className="flex items-center justify-center gap-2 py-3 text-primary font-bold text-sm">
                        <CheckCircle size={16} /> Checked In ✓
                    </div>
                )}

                {/* Join / Leave */}
                {!isHost && match.status !== 'canceled' && match.status !== 'completed' && (
                    <>
                        {!isJoined && !isOnWaitlist && (
                            <Button
                                onClick={handleJoin}
                                disabled={actionLoading || match.status === 'locked'}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                {match.status === 'locked' ? 'ROSTER LOCKED' : isFull ? 'JOIN WAITLIST' : 'JOIN MATCH'}
                            </Button>
                        )}
                        {isOnWaitlist && (
                            <div className="text-center py-3 text-yellow-400 font-bold text-sm">
                                You're on the waitlist
                            </div>
                        )}
                        {isJoined && (
                            <Button
                                onClick={handleLeave}
                                disabled={actionLoading}
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                LEAVE MATCH
                            </Button>
                        )}
                    </>
                )}

                {/* Host Controls */}
                {isHost && (
                    <div className="border border-white/5 rounded-2xl p-4 space-y-3">
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Crown size={10} /> Host Controls
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {match.status === 'open' && (
                                <Button size="sm" onClick={() => handleHostAction('lock')} disabled={actionLoading}
                                    className="flex items-center justify-center gap-1.5 text-xs">
                                    <Lock size={12} /> Lock Roster
                                </Button>
                            )}
                            {match.status === 'locked' && (
                                <Button size="sm" variant="outline" onClick={() => handleHostAction('unlock')} disabled={actionLoading}
                                    className="flex items-center justify-center gap-1.5 text-xs">
                                    <Lock size={12} /> Unlock
                                </Button>
                            )}
                            {['open', 'locked', 'in_progress'].includes(match.status) && (
                                <Button size="sm" onClick={() => handleHostAction('complete')} disabled={actionLoading}
                                    className="flex items-center justify-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-400">
                                    <CheckCircle size={12} /> Complete
                                </Button>
                            )}
                            {['open', 'locked'].includes(match.status) && (
                                <Button size="sm" variant="outline" onClick={() => handleHostAction('cancel')} disabled={actionLoading}
                                    className="flex items-center justify-center gap-1.5 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10">
                                    <XCircle size={12} /> Cancel
                                </Button>
                            )}
                        </div>
                    </div>
                )}
                {/* Floating Actions */}
                <div className="fixed bottom-8 right-6 flex flex-col gap-3">
                    {isJoined && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowChat(true)}
                            className="w-14 h-14 bg-primary text-background rounded-full shadow-[0_0_20px_rgba(57,255,20,0.4)] flex items-center justify-center relative"
                        >
                            <MessageSquare size={24} />
                            {/* We could add an unread badge here later */}
                        </motion.button>
                    )}
                </div>

                {/* Match Chat Overlay */}
                <AnimatePresence>
                    {showChat && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowChat(false)}
                                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-x-0 bottom-0 h-[85vh] z-50"
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
        </motion.div>
    );
}
