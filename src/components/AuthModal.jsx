import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Github, Chrome, Loader2 } from "lucide-react";
import { Button } from "./Button";
import { useAuth } from "../contexts/AuthContext";

export function AuthModal({ isOpen, onClose, initialView = "login" }) {
    const [view, setView] = useState(initialView);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (view === 'login') {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
            onClose();
        } catch (err) {
            if (err.code === 'auth/operation-not-allowed') {
                setError("Sign-in method not enabled. Please enable Email/Password in your Firebase Console.");
            } else {
                setError(err.message.replace('Firebase: ', ''));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] overflow-y-auto"
        >
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[450px] bg-[#111] border border-white/10 rounded-[32px] p-8 z-[70] shadow-2xl overflow-hidden text-left"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-condensed mb-2">
                            {view === "login" ? "Welcome Back" : "Join the Squad"}
                        </h2>
                        <p className="text-white/40 text-sm">
                            {view === "login"
                                ? "Enter your details to get back on the pitch."
                                : "Create an account to start playing."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl font-bold">
                                {error}
                            </div>
                        )}

                        {view === 'signup' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Name</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Marco Polo"
                                    className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-white/20"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-background border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Password</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-white/20"
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2">
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {view === "login" ? "Sign In" : "Create Account"}
                        </Button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#111] px-4 text-white/20 font-bold tracking-widest">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center gap-2 border border-white/5 rounded-xl py-3 hover:bg-white/5 transition-colors">
                                <Chrome size={18} />
                                <span className="text-sm font-bold">Google</span>
                            </button>
                            <button type="button" className="flex items-center justify-center gap-2 border border-white/5 rounded-xl py-3 hover:bg-white/5 transition-colors">
                                <Github size={18} />
                                <span className="text-sm font-bold">Apple</span>
                            </button>
                        </div>
                    </form>

                    <p className="text-center mt-8 text-sm text-white/40">
                        {view === "login" ? "Don't have an account?" : "Already have an account?"}
                        <button
                            type="button"
                            onClick={() => setView(view === "login" ? "signup" : "login")}
                            className="ml-2 text-primary font-bold hover:underline"
                        >
                            {view === "login" ? "Sign Up" : "Log In"}
                        </button>
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
