import { LayoutGrid, Users, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
    { icon: LayoutGrid, label: "Matches", id: "matches" },
    { icon: Users, label: "Squads", id: "squads" },
    { icon: MessageSquare, label: "Feed", id: "feed" },
    { icon: User, label: "Profile", id: "profile" },
];

export function BottomNavbar({ activeTab = "matches", setActiveTab }) {
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-background/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-between items-center z-50">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="flex flex-col items-center gap-1 relative group"
                    >
                        <div className={`relative ${isActive ? "text-primary" : "text-white/40 group-hover:text-white/60"} transition-colors`}>
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#39FF14]"
                                />
                            )}
                        </div>
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? "text-primary font-bold" : "text-white/40"}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
