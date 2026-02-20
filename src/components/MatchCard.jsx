import { MapPin, Clock, Users, Loader2, Check, Shield, ChevronRight } from "lucide-react";
// import { motion } from "framer-motion";
import { Button } from "./Button";
import { useAuth } from "../contexts/AuthContext";
import { doc, runTransaction, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { haptics } from "../utils/haptics";

export function MatchCard({
    id,
    title,
    location,
    kickoffTime,
    time,
    date,
    format,
    skillLevel,
    joined,
    capacity,
    status = 'open',
    joined_players = []
}) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const isJoined = currentUser && joined_players.includes(currentUser.uid);
    const isFull = joined >= capacity;
    const progress = (joined / capacity) * 100;

    const handleJoinToggle = async () => {
        if (!currentUser) return;
        haptics.medium();
        setLoading(true);
        try {
            const matchRef = doc(db, 'matches', id);
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(matchRef);
                if (!snap.exists()) return;
                const data = snap.data();
                const players = data.joined_players || [];
                if (isJoined) {
                    tx.update(matchRef, {
                        joined_players: arrayRemove(currentUser.uid),
                        spotsLeft: data.capacity - players.length + 1,
                    });
                    haptics.light();
                } else if (players.length < data.capacity) {
                    tx.update(matchRef, {
                        joined_players: arrayUnion(currentUser.uid),
                        spotsLeft: data.capacity - players.length - 1,
                    });
                    haptics.success();
                }
            });
        } catch (error) {
            console.error("Error toggling match:", error);
        } finally {
            setLoading(false);
        }
    };

    const spotsRemaining = capacity - joined;
    const spotsColor = spotsRemaining > 1 ? 'bg-primary' : spotsRemaining === 1 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98] group">
            {/* Image Section */}
            <div className="relative h-48 w-full">
                <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={`https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800`}
                    alt={title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent opacity-60" />

                <div className="absolute top-3 left-3 flex gap-2">
                    {format && (
                        <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-primary uppercase tracking-wider">
                            {format} Format
                        </span>
                    )}
                    {skillLevel && (
                        <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-white uppercase tracking-wider">
                            {skillLevel}
                        </span>
                    )}
                </div>

                <div className={`absolute bottom-3 right-3 ${spotsColor} px-3 py-1 rounded-full text-background text-[11px] font-extrabold shadow-lg`}>
                    {spotsRemaining === 0 ? 'FULL' : `${spotsRemaining} SPOTS LEFT`}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 bg-white/[0.02]">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-extrabold dark:text-white leading-tight truncate group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        <p className="text-sm text-white/40 flex items-center gap-1 mt-1 truncate">
                            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                            {location}
                        </p>
                    </div>
                    <div className="text-right ml-4">
                        <p className="text-lg font-extrabold text-primary">£8.50</p>
                        <p className="text-[10px] uppercase font-bold text-white/20 leading-none">per person</p>
                    </div>
                </div>

                {/* Footer / Action */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {/* Joined Players Avatars (Mock for now or map real ones if available) */}
                            {Array.from({ length: Math.min(joined, 3) }).map((_, i) => (
                                <div key={i} className="size-7 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                                    <span className="material-symbols-outlined text-[14px] text-white/20">person</span>
                                </div>
                            ))}
                            {joined > 3 && (
                                <div className="size-7 rounded-full border-2 border-background bg-white/5 flex items-center justify-center text-[10px] font-extrabold text-white/60">
                                    +{joined - 3}
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-white/40 font-bold tracking-tight">
                            {kickoffTime ? new Date(kickoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : time}
                        </span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleJoinToggle();
                        }}
                        disabled={loading || (isFull && !isJoined) || status === 'locked' || status === 'canceled'}
                        className={`px-6 py-2 rounded-full text-sm font-extrabold transition-all active:scale-95 ${isJoined
                                ? 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                                : 'bg-primary text-background shadow-[0_0_20px_#38ff1444] hover:shadow-[0_0_25px_#38ff1466]'
                            }`}
                    >
                        {loading ? '...' : isJoined ? 'Leave' : 'Join'}
                    </button>
                </div>
            </div>

            {/* Click area for details */}
            <div
                className="absolute inset-0 cursor-pointer pointer-events-none"
                onClick={() => navigate(`/matches/${id}`)}
                style={{ pointerEvents: 'auto' }}
            />
        </div>
    );
}
