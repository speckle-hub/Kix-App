import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }) {
    const { currentUser } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            where('read', '==', false)
        );
        return onSnapshot(q, (snap) => {
            setUnreadCount(snap.docs.length);
        });
    }, [currentUser]);

    return (
        <div className="min-h-screen bg-background text-white flex justify-center pointer-events-none">
            <div className="w-full max-w-[450px] bg-background min-h-screen relative border-x border-white/5 shadow-2xl flex flex-col pointer-events-auto">
                {/* Global Notification Bell */}
                {currentUser && (
                    <div className="absolute top-6 right-6 z-40">
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="p-3 bg-secondary/80 backdrop-blur-md border border-white/10 rounded-2xl text-white/60 hover:text-primary transition-all relative group shadow-xl"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-[0_0_10px_#39FF14]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                <main className="flex-1 pb-24">
                    {children}
                </main>

                <NotificationCenter
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                />
            </div>
        </div>
    );
}
