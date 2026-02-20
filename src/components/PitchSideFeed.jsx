import React, { useEffect, useState } from 'react';
// import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { PostComposer } from "./PostComposer";
import { PostCard } from "./PostCard";
import { Loader2, MessageSquare } from "lucide-react";

export function PitchSideFeed({ onNavigateToProfile }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "posts"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPosts(postsData);
            setLoading(false);
        }, (error) => {
            console.error("Firestore error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="p-6 pb-24 max-w-2xl mx-auto">
            <header className="mb-8">
                <h2 className="text-3xl font-condensed mb-1">Pitch Side</h2>
                <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Community updates</p>
            </header>

            <PostComposer />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Filtering Noise...</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {posts.length === 0 ? (
                        <div
                            className="text-center py-20 px-10 border-2 border-dashed border-white/5 rounded-[40px]"
                        >
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="text-white/20" size={32} />
                            </div>
                            <h3 className="text-white/60 font-bold mb-2">The pitch is quiet...</h3>
                            <p className="text-white/30 text-sm">Be the first to share an update from the game!</p>
                        </div>
                    ) : (
                        posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onProfileClick={onNavigateToProfile}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
