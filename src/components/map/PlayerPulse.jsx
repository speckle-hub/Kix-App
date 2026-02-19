import React from 'react';
import { motion } from 'framer-motion';

export function PlayerPulse() {
    return (
        <div className="relative flex items-center justify-center w-8 h-8">
            <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-full h-full bg-primary/40 rounded-full"
            />
            <div className="relative w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_#39FF14]" />
        </div>
    );
}
