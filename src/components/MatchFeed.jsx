import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MatchCard } from "./MatchCard";
import {
    collection, query, orderBy, limit,
    startAfter, getDocs, where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, SlidersHorizontal, X, Trophy, Clock, Users, Zap, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 8;

const FORMATS = ['All', '5v5', '7v7', '11v11'];
const SKILL_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Pro'];
const TIME_FILTERS = ['All', 'Today', 'This Week'];
const SORT_OPTIONS = [
    { label: 'Soonest', value: 'time_asc' },
    { label: 'Most Needed', value: 'spots_desc' },
];

function MatchSkeleton() {
    return (
        <div className="bg-secondary/30 border border-white/5 rounded-3xl p-6 space-y-4 animate-pulse">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <div className="h-5 w-40 bg-white/10 rounded-lg" />
                    <div className="h-3 w-28 bg-white/5 rounded-lg" />
                </div>
                <div className="h-7 w-20 bg-white/10 rounded-full" />
            </div>
            <div className="flex gap-4">
                <div className="h-3 w-20 bg-white/5 rounded-lg" />
                <div className="h-3 w-16 bg-white/5 rounded-lg" />
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full" />
            <div className="h-10 w-full bg-white/5 rounded-2xl" />
        </div>
    );
}

function EmptyState({ hasFilters, onClear }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center gap-4"
        >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                <Trophy size={28} className="text-white/20" />
            </div>
            <div>
                <h3 className="text-white/60 font-bold text-lg mb-1">
                    {hasFilters ? 'No matches found' : 'No open matches yet'}
                </h3>
                <p className="text-white/30 text-sm max-w-[240px] mx-auto">
                    {hasFilters
                        ? 'Try adjusting your filters to find more games.'
                        : 'Be the first to create a match in your area!'}
                </p>
            </div>
            {hasFilters && (
                <button
                    onClick={onClear}
                    className="text-primary text-xs font-bold tracking-widest uppercase hover:underline"
                >
                    Clear Filters
                </button>
            )}
        </motion.div>
    );
}

function FilterChip({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${active
                ? 'bg-primary text-background'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
        >
            {label}
        </button>
    );
}

// In-memory cache for query results
const queryCache = new Map();

export function MatchFeed() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();

    // Filters
    const [format, setFormat] = useState('All');
    const [skillLevel, setSkillLevel] = useState('All');
    const [timeFilter, setTimeFilter] = useState('All');
    const [sortBy, setSortBy] = useState('time_asc');

    const lastDocRef = useRef(null);
    const loaderRef = useRef(null);

    const hasFilters = format !== 'All' || skillLevel !== 'All' || timeFilter !== 'All';

    const buildQuery = useCallback((afterDoc = null) => {
        let constraints = [
            where('status', 'in', ['open', 'locked']),
        ];

        if (format !== 'All') constraints.push(where('format', '==', format));
        if (skillLevel !== 'All') constraints.push(where('skillLevel', '==', skillLevel));

        if (timeFilter === 'Today') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);
            constraints.push(where('kickoffTime', '>=', start.toISOString()));
            constraints.push(where('kickoffTime', '<=', end.toISOString()));
        } else if (timeFilter === 'This Week') {
            const start = new Date();
            const end = new Date(); end.setDate(end.getDate() + 7);
            constraints.push(where('kickoffTime', '>=', start.toISOString()));
            constraints.push(where('kickoffTime', '<=', end.toISOString()));
        }

        const orderField = sortBy === 'time_asc' ? 'kickoffTime' : 'spotsLeft';
        const orderDir = sortBy === 'time_asc' ? 'asc' : 'desc';
        constraints.push(orderBy(orderField, orderDir));
        constraints.push(limit(PAGE_SIZE));

        if (afterDoc) constraints.push(startAfter(afterDoc));

        return query(collection(db, 'matches'), ...constraints);
    }, [format, skillLevel, timeFilter, sortBy]);

    const fetchMatches = useCallback(async (reset = false) => {
        const cacheKey = `${format}-${skillLevel}-${timeFilter}-${sortBy}`;

        if (reset) {
            setLoading(true);
            setError(null);
            lastDocRef.current = null;

            // Check cache first
            if (queryCache.has(cacheKey)) {
                const cached = queryCache.get(cacheKey);
                setMatches(cached.matches);
                lastDocRef.current = cached.lastDoc;
                setHasMore(cached.hasMore);
                setLoading(false);
                return;
            }
        } else {
            setLoadingMore(true);
        }

        try {
            const q = buildQuery(reset ? null : lastDocRef.current);
            const snapshot = await getDocs(q);
            const newMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
            const more = snapshot.docs.length === PAGE_SIZE;

            if (reset) {
                setMatches(newMatches);
                // Cache the first page
                queryCache.set(cacheKey, { matches: newMatches, lastDoc, hasMore: more });
            } else {
                setMatches(prev => [...prev, ...newMatches]);
            }

            lastDocRef.current = lastDoc;
            setHasMore(more);
        } catch (err) {
            console.error('MatchFeed error:', err);
            setError(err.message || 'Failed to load matches.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [buildQuery, format, skillLevel, timeFilter, sortBy]);

    // Refetch when filters change
    useEffect(() => {
        fetchMatches(true);
    }, [format, skillLevel, timeFilter, sortBy]);

    // Infinite scroll observer
    useEffect(() => {
        if (!loaderRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchMatches(false);
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, fetchMatches]);

    const clearFilters = () => {
        setFormat('All');
        setSkillLevel('All');
        setTimeFilter('All');
        setSortBy('time_asc');
    };

    return (
        <div className="p-6 pb-32 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-condensed">Open Matches</h2>
                    <p className="text-white/40 text-sm uppercase tracking-widest font-bold">
                        {loading ? 'Scouting...' : `${matches.length} games found`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/matches/create')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-background hover:bg-primary/80 transition-colors"
                    >
                        <Plus size={14} /> Create
                    </button>
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${showFilters || hasFilters
                                ? 'bg-white/10 text-white'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        <SlidersHorizontal size={14} />
                        Filters
                        {hasFilters && (
                            <span className="w-4 h-4 bg-primary text-background rounded-full text-[10px] flex items-center justify-center font-black">
                                !
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-secondary/40 border border-white/5 rounded-3xl p-5 space-y-4">
                            {/* Format */}
                            <div>
                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Users size={10} /> Format
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {FORMATS.map(f => (
                                        <FilterChip key={f} label={f} active={format === f} onClick={() => setFormat(f)} />
                                    ))}
                                </div>
                            </div>
                            {/* Skill Level */}
                            <div>
                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Zap size={10} /> Skill Level
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {SKILL_LEVELS.map(s => (
                                        <FilterChip key={s} label={s} active={skillLevel === s} onClick={() => setSkillLevel(s)} />
                                    ))}
                                </div>
                            </div>
                            {/* Time */}
                            <div>
                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Clock size={10} /> When
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {TIME_FILTERS.map(t => (
                                        <FilterChip key={t} label={t} active={timeFilter === t} onClick={() => setTimeFilter(t)} />
                                    ))}
                                </div>
                            </div>
                            {/* Sort */}
                            <div>
                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Sort By</p>
                                <div className="flex gap-2">
                                    {SORT_OPTIONS.map(s => (
                                        <FilterChip key={s.value} label={s.label} active={sortBy === s.value} onClick={() => setSortBy(s.value)} />
                                    ))}
                                </div>
                            </div>
                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1.5 text-white/30 text-xs font-bold uppercase hover:text-white transition-colors"
                                >
                                    <X size={12} /> Clear All
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                    <button
                        onClick={() => fetchMatches(true)}
                        className="text-primary text-xs font-bold uppercase mt-2 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Match List */}
            <div className="grid gap-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <MatchSkeleton key={i} />)
                ) : matches.length === 0 ? (
                    <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {matches.map((match, i) => (
                            <motion.div
                                key={match.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i < 3 ? i * 0.05 : 0 }}
                            >
                                <MatchCard
                                    {...match}
                                    joined={match.joined_players?.length || 0}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Infinite scroll sentinel */}
            {!loading && hasMore && (
                <div ref={loaderRef} className="flex justify-center py-4">
                    {loadingMore && <Loader2 size={24} className="animate-spin text-primary" />}
                </div>
            )}

            {!loading && !hasMore && matches.length > 0 && (
                <p className="text-center text-white/20 text-xs font-bold uppercase tracking-widest py-4">
                    You've seen all the games
                </p>
            )}
        </div>
    );
}
