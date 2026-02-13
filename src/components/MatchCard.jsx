import { MapPin, Clock, Users, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useState } from "react";

export function MatchCard({
    id,
    title,
    location,
    time,
    date,
    joined,
    capacity,
    joined_players = []
}) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const isJoined = currentUser && joined_players.includes(currentUser.uid);
    const progress = (joined / capacity) * 100;

    const handleJoinToggle = async () => {
        if (!currentUser) {
            alert("Please sign in to join a match!");
            return;
        }

        setLoading(true);
        const matchRef = doc(db, 'matches', id);

        try {
            if (isJoined) {
                await updateDoc(matchRef, {
                    joined_players: arrayRemove(currentUser.uid)
                });
            } else {
                if (joined >= capacity) {
                    alert("This match is full!");
                    return;
                }
                await updateDoc(matchRef, {
                    joined_players: arrayUnion(currentUser.uid)
                });
            }
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
                <div>
                    <h3 className="text-xl font-condensed group-hover:text-primary transition-colors">{title}</h3>
                    <div className="flex items-center gap-2 text-white/40 text-sm mt-1">
                        <MapPin size={14} />
                        <span>{location}</span>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
          ${isJoined ? 'bg-primary text-background' : 'bg-primary/10 text-primary'}`}>
                    {isJoined ? 'Joined' : `${capacity - joined} Spots Left`}
                </div>
            </div>

            <div className="flex gap-6 mb-6">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Clock size={14} className="text-primary" />
                    <span>{time}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Users size={14} className="text-primary" />
                    <span>{date}</span>
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

            <Button
                onClick={handleJoinToggle}
                disabled={loading}
                variant={isJoined ? "outline" : "primary"}
                className="w-full flex justify-center items-center gap-2"
            >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {isJoined ? "LEAVE MATCH" : "JOIN MATCH"}
            </Button>

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
