import { LayoutGrid, Users, MessageSquare, User, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

const navItems = [
    { icon: LayoutGrid, label: "Matches", id: "matches", path: "/matches" },
    { icon: Users, label: "Squads", id: "squads", path: "/squads" },
    { icon: Newspaper, label: "News", id: "news", path: "/news" },
    { icon: MessageSquare, label: "Feed", id: "feed", path: "/feed" },
    { icon: User, label: "Profile", id: "profile", path: "/profile" },
];

export function BottomNavbar() {
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-background/80 backdrop-blur-xl border-t border-white/10 px-3 py-4 flex justify-between items-center z-[9999] pointer-events-auto">
            {navItems.map((item) => {
                const Icon = item.icon;

                return (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        onClick={() => console.log('🎯 KIX: Navigating to:', item.path, item.label)}
                        className={({ isActive }) => `flex flex-col items-center gap-1 relative group`}
                    >
                        {({ isActive }) => (
                            <>
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
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
}
