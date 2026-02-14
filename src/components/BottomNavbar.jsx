import { LayoutGrid, Users, MessageSquare, User, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
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
        console.log(`🎯 KIX: Button Clicked -> ${label} (${path})`);
        try {
            navigate(path);
            console.log(`✅ KIX: Navigation command sent to ${path}`);
        } catch (error) {
            console.error("❌ KIX: Navigation Failed:", error);
        }
    };

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-background/80 backdrop-blur-xl border-t border-white/10 px-3 py-4 flex justify-between items-center z-[9999] pointer-events-auto">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                    <button
                        key={item.id}
                        onClick={(e) => {
                            e.preventDefault(); // Prevent any default behavior
                            handleNavigation(item.path, item.label);
                        }}
                        className="flex flex-col items-center gap-1 relative group w-full focus:outline-none touch-manipulation cursor-pointer"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                        <div className={`relative ${isActive ? "text-primary" : "text-white/40 group-hover:text-white/60"} transition-colors pointer-events-none`}>
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#39FF14]"
                                />
                            )}
                        </div>
                        <span className={`text-[10px] font-medium uppercase tracking-wider pointer-events-none ${isActive ? "text-primary font-bold" : "text-white/40"}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
