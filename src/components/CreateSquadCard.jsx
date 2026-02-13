import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";

export function CreateSquadCard({ onClick }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full relative group"
        >
            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl group-hover:bg-primary/10 transition-colors" />
            <div className="relative bg-background border-2 border-dashed border-primary/20 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 group-hover:border-primary/60 transition-colors">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <Plus size={32} className="text-primary" />
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-condensed tracking-tight">CREATE A SQUAD</h3>
                    <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Recruit your dream team</p>
                </div>
            </div>
        </motion.button>
    );
}
