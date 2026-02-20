import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Info, X } from 'lucide-react';
import { Button } from '../Button';

export function PitchCard({ pitch, onClose }) {
    if (!pitch) return null;

    const handleDirections = () => {
        const { lat, lng } = pitch.location || {};
        const url = lat && lng
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pitch.name || 'football pitch')}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-x-0 bottom-0 z-[60] p-4 pt-0"
        >
            <div className="bg-secondary/90 backdrop-blur-xl border-t border-x border-white/10 rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.5)] max-w-lg mx-auto overflow-hidden">
                <div className="p-1 flex justify-center">
                    <div className="w-12 h-1 bg-white/10 rounded-full" />
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className="text-xl font-condensed">{pitch.name}</h2>
                            <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                                <MapPin size={12} />
                                {pitch.distance ? `${(pitch.distance / 1000).toFixed(1)}km away` : 'Nearby'}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-1">Type</p>
                            <p className="text-sm font-bold text-white">{pitch.type || 'Outdoor'}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-1">Condition</p>
                            <p className="text-sm font-bold text-white">Pro Turf</p>
                        </div>
                    </div>

                    {pitch.notes && (
                        <p className="text-sm text-white/60 leading-relaxed italic">
                            "{pitch.notes}"
                        </p>
                    )}

                    <div className="flex gap-2">
                        <Button
                            className="flex-1 flex items-center justify-center gap-2"
                            onClick={handleDirections}
                        >
                            <Navigation size={16} />
                            GET DIRECTIONS
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center justify-center"
                            onClick={() => {/* View Matches logic */ }}
                        >
                            <Info size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
