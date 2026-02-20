import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, X, Info, CheckCircle2, AlertTriangle,
    Calendar, Users, MessageSquare, Trash2
} from 'lucide-react';
import {
    collection, query, where, orderBy,
    limit, onSnapshot, updateDoc,
    doc, deleteDoc, writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function NotificationCenter({ isOpen, onClose }) {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setNotifications(items);
            setLoading(false);
        });

        return unsub;
    }, [currentUser]);

    const markAsRead = async (id) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (e) { console.error(e); }
    };

    const clearAll = async () => {
        if (notifications.length === 0) return;
        const batch = writeBatch(db);
        notifications.forEach(n => {
            batch.delete(doc(db, 'notifications', n.id));
        });
        await batch.commit();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'match_update': return <Calendar className="text-blue-400" size={16} />;
            case 'squad_invite': return <Users className="text-primary" size={16} />;
            case 'chat_mention': return <MessageSquare className="text-yellow-400" size={16} />;
            case 'alert': return <AlertTriangle className="text-red-400" size={16} />;
            default: return <Info className="text-white/40" size={16} />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            {isOpen && (
                <>
                    <div
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
                    />
                    <div
                        className="fixed inset-y-0 right-0 w-full max-w-sm bg-secondary border-l border-white/5 z-[101] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                    <Bell className="text-primary" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-condensed">Signals</h3>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                        {unreadCount} UNREAD
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="p-2 hover:bg-white/5 text-white/20 hover:text-red-400 transition-colors rounded-lg"
                                        title="Clear All"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/40">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div
                                    >
                                        <Bell size={24} className="text-white/10" />
                                    </div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                                    <Bell size={48} className="mb-4" />
                                    <p className="font-bold uppercase tracking-[0.2em] text-sm">Quiet Day Pitchside</p>
                                    <p className="text-xs mt-1">Check back later for match updates and squad invites.</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.read && markAsRead(n.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.read
                                            ? 'bg-white/5 border-transparent opacity-60'
                                            : 'bg-white/[0.08] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1">{getIcon(n.type)}</div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-sm font-bold text-white/90 leading-snug">{n.title}</h4>
                                                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-1" />}
                                                </div>
                                                <p className="text-xs text-white/40 leading-relaxed">{n.message}</p>
                                                <div className="pt-1 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                                    {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
