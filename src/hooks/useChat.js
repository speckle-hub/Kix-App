import { useState, useEffect, useCallback, useRef } from 'react';
import {
    collection, query, orderBy, limit,
    onSnapshot, addDoc, serverTimestamp,
    doc, updateDoc, increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * useChat hook:
 * Handles real-time messaging for either a Match or a Squad.
 * 
 * @param {string} type - 'matches' or 'squads'
 * @param {string} id - The ID of the match or squad
 */
export function useChat(type, id) {
    const { currentUser, userData } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        if (!id || !type) return;

        setLoading(true);
        const chatRef = collection(db, type, id, 'messages');
        const q = query(chatRef, orderBy('createdAt', 'asc'), limit(100));

        unsubscribeRef.current = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
        }, (err) => {
            console.error('Chat error:', err);
            setError('Failed to connect to chat.');
            setLoading(false);
        });

        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, [type, id]);

    const sendMessage = useCallback(async (content) => {
        if (!content.trim() || !currentUser || !id) return;

        const chatRef = collection(db, type, id, 'messages');
        const messageData = {
            text: content.trim(),
            senderId: currentUser.uid,
            senderName: userData?.name || 'Anonymous',
            senderPhoto: userData?.photoURL || null,
            createdAt: serverTimestamp(),
            type: 'text'
        };

        try {
            await addDoc(chatRef, messageData);

            // Increment unread counts or update lastMessage in the parent doc?
            // For now, keep it simple, but we could add updateDoc(doc(db, type, id), { lastMessage: ... })
        } catch (err) {
            console.error('Send error:', err);
            throw err;
        }
    }, [type, id, currentUser, userData]);

    return { messages, loading, error, sendMessage };
}
