import { motion } from "framer-motion";
import { Button } from "./Button";

export function Hero({ onGetStarted, onLogin }) {
    return (
        <section className="relative h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
            >
                <span className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block">
                    Welcome to the Field
                </span>
                <h1 className="text-6xl md:text-7xl font-condensed mb-6 leading-[0.9]">
                    OWN THE <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-green-400">PITCH</span>
                </h1>
                <p className="text-white/60 max-w-[300px] mx-auto mb-10 text-lg leading-relaxed">
                    The ultimate social network for local football. Find matches, build squads, and play more.
                </p>

                <div className="flex flex-col gap-4 w-full max-w-[280px] mx-auto">
                    <Button onClick={onGetStarted} size="lg" className="shadow-[0_0_20px_#39FF1444]">
                        GET ON THE PITCH
                    </Button>
                    <button
                        onClick={onLogin}
                        className="text-white/40 hover:text-white transition-colors text-sm font-semibold uppercase tracking-widest"
                    >
                        Already a player? Log In
                    </button>
                </div>
            </motion.div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
        </section>
    );
}
