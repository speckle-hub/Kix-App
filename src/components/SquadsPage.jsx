import { motion } from "framer-motion";
import { SquadCard } from "./SquadCard";
import { CreateSquadCard } from "./CreateSquadCard";
import { SquadChatPreview } from "./SquadChatPreview";
import { Trophy, Target, Zap } from "lucide-react";

const FEATURED_SQUADS = [
    { id: 1, name: "London Legends FC", members: 14, maxMembers: 20, type: "Competitive", logo: Trophy },
    { id: 2, name: "Midnight Strikers", members: 8, maxMembers: 12, type: "Casual", logo: Zap },
    { id: 3, name: "Elite Tekkers", members: 18, maxMembers: 18, type: "Competitive", logo: Target },
];

export function SquadsPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 space-y-10"
        >
            <header>
                <h2 className="text-3xl font-condensed mb-2">My Squad</h2>
                <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Manage your team</p>
            </header>

            <CreateSquadCard onClick={() => alert('Create Squad form coming soon!')} />

            <section className="space-y-6">
                <div className="flex justify-between items-end">
                    <h3 className="text-xl font-condensed tracking-wide">Featured Squads</h3>
                    <button className="text-primary text-xs font-bold hover:underline">BROWSE ALL</button>
                </div>
                <div className="grid gap-6">
                    {FEATURED_SQUADS.map((squad) => (
                        <SquadCard key={squad.id} {...squad} />
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-xl font-condensed tracking-wide">Team Chat</h3>
                <SquadChatPreview />
            </section>

            <div className="pb-10" />
        </motion.div>
    );
}
