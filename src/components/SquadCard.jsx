import { motion } from "framer-motion";
import { Users, Shield, ArrowRight } from "lucide-react";
import { Button } from "./Button";

export function SquadCard({ name, members, maxMembers, type, logo: Logo = Shield }) {
    const isCompetitive = type === 'Competitive';

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-secondary/40 border border-white/5 rounded-3xl p-5 hover:border-primary/20 transition-all group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/40 transition-colors">
                        <Logo size={28} className="text-primary/60" />
                    </div>
                    <div>
                        <h3 className="text-xl font-condensed tracking-tight">{name}</h3>
                        <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
              ${isCompetitive
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-primary/10 text-primary border border-primary/20'}`}
                        >
                            {type}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1.5 text-white/40 text-xs font-bold uppercase mb-1 justify-end">
                        <Users size={12} />
                        <span>Squad</span>
                    </div>
                    <div className="text-sm font-bold">
                        {members}<span className="text-white/20">/{maxMembers}</span>
                    </div>
                </div>
            </div>

            <Button variant="outline" className="w-full justify-between items-center flex py-2 text-sm">
                REQUEST TO JOIN
                <ArrowRight size={16} />
            </Button>
        </motion.div>
    );
}
