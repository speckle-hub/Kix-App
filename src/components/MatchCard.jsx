import { MapPin, Clock, Users, Loader2, Check, Shield, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { useAuth } from "../contexts/AuthContext";
import { doc, runTransaction, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
                } else if (players.length < data.capacity) {
                    tx.update(matchRef, {
                        joined_players: arrayUnion(currentUser.uid),
                        spotsLeft: data.capacity - players.length - 1,
                    });
                }
            });
        } catch (error) {
            console.error("Error toggling match:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-secondary/50 border border-white/10 rounded-3xl p-6 hover:border-primary/30 transition-colors group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-condensed group-hover:text-primary transition-colors truncate">{title}</h3>
                    <div className="flex items-center gap-2 text-white/40 text-sm mt-1">
                        <MapPin size={14} />
                        <span className="truncate">{location}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {format && (
                            <span className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] font-bold text-white/40 uppercase">{format}</span>
                        )}
                        {skillLevel && (
                            <span className="px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                                <Shield size={8} />{skillLevel}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`ml-3 flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
          ${isJoined ? 'bg-primary text-background' : 'bg-primary/10 text-primary'}`}>
                    {isJoined ? 'Joined' : `${capacity - joined} Left`}
                </div>
            </div>

            <div className="flex gap-6 mb-6">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Clock size={14} className="text-primary" />
                    <span>{kickoffTime ? new Date(kickoffTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : time}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Users size={14} className="text-primary" />
                    <span>{joined}/{capacity}</span>
                </div>
            </div>

            <div className="space-y-2 mb-6">
                <div className="flex justify-between items-end text-xs mb-1">
                    <span className="text-white/40 font-bold uppercase">Players Joined</span>
                    <div className="flex items-center gap-2">
                        {isJoined && <Check size={14} className="text-primary" />}
                        <span className="text-white font-bold">{joined}<span className="text-white/40 ml-1">/ {capacity}</span></span>
                    </div>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-primary"
                        style={{ boxShadow: '0 0 10px #39FF14' }}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={handleJoinToggle}
                    disabled={loading || (isFull && !isJoined) || status === 'locked' || status === 'canceled'}
                    variant={isJoined ? "outline" : "primary"}
                    className="flex-1 flex justify-center items-center gap-2"
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {status === 'locked' ? 'LOCKED' : isJoined ? 'LEAVE' : isFull ? 'FULL' : 'JOIN'}
                </Button>
                <button
                    onClick={() => navigate(`/matches/${id}`)}
                    className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                >
                    <ChevronRight size={18} className="text-white/40" />
                </button>
            </div>

            {/* Decorative pulse if joined */}
            {isJoined && (
                <motion.div
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-primary pointer-events-none"
                />
            )}
        </motion.div>
    );
}
