import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trophy } from "lucide-react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";

export function PostCard({ post, onProfileClick }) {
    const [goaled, setGoaled] = useState(false);
    const [localGoals, setLocalGoals] = useState(post.goalCount || 0);

    const handleGoal = async () => {
        try {
            const postRef = doc(db, "posts", post.id);
            await updateDoc(postRef, {
                goalCount: increment(goaled ? -1 : 1)
            });
            setLocalGoals(prev => goaled ? prev - 1 : prev + 1);
            setGoaled(!goaled);
        } catch (error) {
            console.error("Error updating goal:", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-secondary/20 border border-white/5 rounded-[32px] p-6 mb-6 hover:border-white/10 transition-colors group"
        >
            <div className="flex justify-between items-start mb-4">
                <div
                    onClick={onProfileClick}
                    className="flex gap-3 items-center cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
                        <span className="text-white/40 text-xs font-bold">{post.userName?.[0]}</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors capitalize">
                            {post.userName}
                        </h4>
                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                            {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </p>
                    </div>
                </div>
                <button className="text-white/20 hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="mb-6 px-1">
                <p className="text-white/80 leading-relaxed">
                    {post.content}
                </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex gap-6">
                    <button
                        onClick={handleGoal}
                        className={`flex items-center gap-2 transition-all ${goaled ? 'text-primary' : 'text-white/40 hover:text-primary'}`}
                    >
                        <div className={`p-2 rounded-full transition-colors ${goaled ? 'bg-primary/20' : 'group-hover:bg-primary/10'}`}>
                            <Trophy size={18} fill={goaled ? "currentColor" : "none"} />
                        </div>
                        <span className="text-sm font-bold">{localGoals}</span>
                    </button>

                    <button className="flex items-center gap-2 text-white/40 hover:text-white transition-all group/btn">
                        <div className="p-2 rounded-full group-hover/btn:bg-white/5 transition-colors">
                            <MessageCircle size={18} />
                        </div>
                        <span className="text-sm font-bold">0</span>
                    </button>
                </div>

                <button className="text-white/20 hover:text-white transition-colors p-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Share2 size={18} />
                </button>
            </div>
        </motion.div>
    );
}
