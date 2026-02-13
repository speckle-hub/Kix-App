import { Send, Image, Smile } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_MESSAGES = [
    { id: 1, user: 'Coach Mike', text: 'Guys, training shifted to 7pm tomorrow.', time: '14:20', isMe: false },
    { id: 2, user: 'Me', text: 'Got it, I’ll be there!', time: '14:22', isMe: true },
    { id: 3, user: 'Striker Steve', text: 'Can we practice set pieces?', time: '14:30', isMe: false },
    { id: 4, user: 'Coach Mike', text: 'Good idea. Steve, bring the extra balls.', time: '14:35', isMe: false },
];

export function SquadChatPreview() {
    return (
        <div className="bg-secondary/30 border border-white/5 rounded-3xl flex flex-col h-[400px] overflow-hidden">
            {/* Chat header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-sm">Squad Strategy</h4>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">3 players online</p>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {MOCK_MESSAGES.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, x: msg.isMe ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={msg.id}
                        className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                    >
                        {!msg.isMe && <span className="text-[10px] font-bold text-white/30 ml-2 mb-1 uppercase italic">{msg.user}</span>}
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm
              ${msg.isMe
                                ? 'bg-primary text-background font-medium rounded-tr-none'
                                : 'bg-white/10 text-white rounded-tl-none border border-white/5'}`}
                        >
                            {msg.text}
                            <div className={`text-[9px] mt-1 text-right ${msg.isMe ? 'opacity-60' : 'opacity-30'}`}>
                                {msg.time}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Input bar */}
            <div className="p-4 bg-background/50 border-t border-white/5 flex items-center gap-3">
                <button className="text-white/20 hover:text-white transition-colors"><Image size={18} /></button>
                <div className="flex-1 bg-white/5 border border-white/5 rounded-full px-4 py-2 flex items-center">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="bg-transparent border-none outline-none text-xs flex-1 text-white/80 placeholder:text-white/20"
                    />
                    <Smile size={16} className="text-white/20" />
                </div>
                <button className="bg-primary p-2 rounded-full text-background hover:scale-105 transition-transform">
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}
