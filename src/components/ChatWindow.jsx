import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageCircle, X } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

export function ChatWindow({ type, id, title, onClose }) {
    const { currentUser } = useAuth();
    const { messages, loading, sendMessage } = useChat(type, id);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || sending) return;

        setSending(true);
        try {
            await sendMessage(inputText);
            setInputText('');
        } catch (err) {
            console.error('Send failed:', err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background border-t border-white/5 rounded-t-[3rem] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MessageCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-condensed text-lg">{title || 'Team Chat'}</h3>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                            {messages.length} messages
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} className="text-white/40" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-20">
                        <MessageCircle size={48} />
                        <p className="text-sm font-bold uppercase tracking-wider">No signals yet.</p>
                        <p className="text-xs">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === currentUser?.uid;
                        return (
                            <div
                                key={msg.id || i}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {!isMe && (
                                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1 ml-3">
                                            {msg.senderName}
                                        </span>
                                    )}
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe
                                        ? 'bg-primary text-background font-medium rounded-tr-none'
                                        : 'bg-white/5 text-white rounded-tl-none border border-white/5'
                                        }`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[8px] text-white/20 mt-1 mx-1">
                                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <form
                onSubmit={handleSend}
                className="p-4 bg-secondary/30 border-t border-white/5 safe-bottom"
            >
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || sending}
                        className={`p-3 rounded-full transition-all ${inputText.trim() && !sending
                            ? 'bg-primary text-background'
                            : 'bg-white/5 text-white/20'
                            }`}
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </form>
        </div>
    );
}
