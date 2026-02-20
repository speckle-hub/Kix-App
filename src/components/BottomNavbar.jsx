import React from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, Users, MessageSquare, User, Newspaper, Map as MapIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { haptics } from '../utils/haptics';

const navItems = [
    { icon: LayoutGrid, label: "Matches", id: "matches", path: "/matches" },
    { icon: Users, label: "Squads", id: "squads", path: "/squads" },
    { icon: MapIcon, label: "Map", id: "map", path: "/map" },
    { icon: Newspaper, label: "News", id: "news", path: "/news" },
    { icon: MessageSquare, label: "Feed", id: "feed", path: "/feed" },
    { icon: User, label: "Profile", id: "profile", path: "/profile" },
];

export function BottomNavbar() {
    const navigate = useNavigate();
    const location = useLocation();

    // The component UI logic
    const NavbarContent = (
        <div className="fixed bottom-8 left-0 right-0 z-[99999] pointer-events-none flex justify-center isolate">
            <nav className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 flex items-center gap-1 shadow-2xl pointer-events-auto ring-1 ring-white/5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <button
                            key={item.id}
                            onClick={(e) => {
                                e.stopPropagation(); // Stop bubbling
                                haptics.light();
                                navigate(item.path);
                            }}
                            className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer focus:outline-none group"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="navTab"
                                    className="absolute inset-0 bg-primary/20 rounded-full"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <Icon
                                size={24}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`relative z-10 transition-colors duration-200 ${isActive ? "text-primary" : "text-white/50 group-hover:text-white"}`}
                            />

                            {isActive && (
                                <motion.div
                                    layoutId="navIndicator"
                                    className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_#39FF14]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );

    // Render directly into the <body> tag, skipping the App/Layout structure
    return createPortal(NavbarContent, document.body);
}
