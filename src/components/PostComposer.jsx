import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Image, Video, Send, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "./Button";

export function PostComposer() {
    const { currentUser, userData } = useAuth();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || !currentUser) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "posts"), {
                userId: currentUser.uid,
                userName: userData?.name || "Kix Player",
                content: content.trim(),
                goalCount: 0,
                createdAt: serverTimestamp(),
            });
            setContent("");
        } catch (error) {
            console.error("Error adding post:", error);
            alert("Failed to post. Check your connection!");
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/30 border border-white/5 rounded-[32px] p-6 mb-8 backdrop-blur-sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {userData?.avatar_url ? (
                            <img src={userData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-primary font-bold">{userData?.name?.[0] || "K"}</span>
                        )}
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's happening on the pitch?"
                        className="w-full bg-transparent border-none outline-none resize-none pt-2 text-white placeholder:text-white/20 min-h-[80px]"
                    />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <div className="flex gap-2">
                        <button type="button" className="p-2 text-white/40 hover:text-primary transition-colors">
                            <Image size={20} />
                        </button>
                        <button type="button" className="p-2 text-white/40 hover:text-primary transition-colors">
                            <Video size={20} />
                        </button>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !content.trim()}
                        size="sm"
                        className="px-6 rounded-full flex gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        <span>POST</span>
                    </Button>
                </div>
            </form>
        </motion.div>
    );
}
