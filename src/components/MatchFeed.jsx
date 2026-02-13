import React, { useEffect, useState } from 'react';
import { MatchCard } from "./MatchCard";
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2 } from 'lucide-react';

export function MatchFeed() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for matches
        const q = query(collection(db, 'matches'), orderBy('time', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMatches(matchesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 size={40} className="animate-spin text-primary" />
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Scouting Pitches...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-3xl font-condensed">Open Matches</h2>
                    <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Matches near you</p>
                </div>
                <button className="text-primary text-xs font-bold hover:underline mb-1">SEE MAP</button>
            </div>

            <div className="grid gap-6">
                {matches.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center gap-4">
                        <p className="text-white/20 text-sm font-medium">No matches found. Create one to get started!</p>
                        <button className="text-primary text-xs font-bold tracking-widest uppercase hover:scale-105 transition-transform">Request a Match</button>
                    </div>
                ) : (
                    matches.map(match => (
                        <MatchCard
                            key={match.id}
                            {...match}
                            joined={match.joined_players?.length || 0}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
