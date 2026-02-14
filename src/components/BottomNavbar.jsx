import { LayoutGrid, Users, MessageSquare, User, Newspaper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
    { icon: LayoutGrid, label: "Matches", id: "matches", path: "/matches" },
    { icon: Users, label: "Squads", id: "squads", path: "/squads" },
    { icon: Newspaper, label: "News", id: "news", path: "/news" },
    { icon: MessageSquare, label: "Feed", id: "feed", path: "/feed" },
    { icon: User, label: "Profile", id: "profile", path: "/profile" },
];

export function BottomNavbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigation = (path, label) => {
        console.log(`🎯 KIX: Dock Item Clicked -> ${label} (${path})`);
        try {
            navigate(path);
        } catch (error) {
            console.error("❌ KIX: Navigation Failed:", error);
        }
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999] isolate pointer-events-auto">
            <nav className="flex items-center gap-1 p-2 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl ring-1 ring-white/5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <button
                            key={item.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNavigation(item.path, item.label);
                            }}
                            className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer touch-manipulation focus:outline-none transition-transform active:scale-95 group"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            {/* Active Tab "Liquid" Background */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBackground"
                                    className="absolute inset-0 bg-primary/20 rounded-full"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}

                            {/* Icon */}
                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`relative z-10 transition-colors duration-300 ${isActive ? "text-primary" : "text-white/60 group-hover:text-white"
                                    }`}
                            />

                            {/* Active Dot (iOS Style) */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabDot"
                                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_#39FF14]"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
