import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, SlidersHorizontal, X, Trophy, Clock, Users, Zap, Plus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RequestCard } from './RequestCard';
import { MatchCard } from './MatchCard';
import { MotionList } from './MotionList';
import { haptics } from '../utils/haptics';

const PAGE_SIZE = 8;
const FORMATS = ['All', '5v5', '7v7', '11v11'];
const SKILL_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Pro'];
const TIME_FILTERS = ['All', 'Today', 'This Week'];
const SORT_OPTIONS = [
    { label: 'Soonest', value: 'time_asc' },
    { label: 'Most Needed', value: 'spots_desc' },
];

const queryCache = new Map();

/**
 * FilterChip sub-component
 */
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

export function MatchFeed() {
    console.log("MatchFeed Initialization...");
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') === 'requests' ? 'requests' : 'matches';

    const [matches, setMatches] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [format, setFormat] = useState('All');
    const [skillLevel, setSkillLevel] = useState('All');
    const [timeFilter, setTimeFilter] = useState('All');
    const [sortBy, setSortBy] = useState('time_asc');

    const lastDocRef = useRef(null);
    const loaderRef = useRef(null);

    const hasFilters = format !== 'All' || skillLevel !== 'All' || timeFilter !== 'All';

    /**
     * Internal Sub-components to ensure scope access to navigate/currentUser
     */
    const MatchSkeleton = () => (
        <div className="glass-card rounded-2xl p-4 space-y-4 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="space-y-3">
                    <div className="h-6 w-48 bg-white/10 rounded-lg" />
                    <div className="h-3 w-32 bg-white/5 rounded-lg" />
                </div>
                <div className="h-8 w-24 bg-white/10 rounded-full" />
            </div>
            <div className="h-40 w-full bg-white/5 rounded-xl" />
            <div className="flex justify-between items-center pt-2">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                        <div key={`skel-user-${i}`} className="size-7 rounded-full bg-white/10 border-2 border-background" />
                    ))}
                </div>
                <div className="h-10 w-28 bg-white/10 rounded-full" />
            </div>
        </div>
    );

    const EmptyState = ({ hasFilters, onClear }) => (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_#38ff1411]">
                <span className="material-symbols-outlined text-4xl text-primary/40">sports_soccer</span>
            </div>
            <div className="max-w-xs space-y-2">
                <h3 className="text-xl font-extrabold text-white">
                    {hasFilters ? 'No matches found' : 'No games nearby'}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed font-bold">
                    {hasFilters
                        ? 'Try adjusting your filters to discover more football matches in your area.'
                        : 'Be the one who kicks things off! Create a match and invite players to join you.'}
                </p>
            </div>
            {hasFilters ? (
                <button
                    onClick={onClear}
                    className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-extrabold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    Clear All Filters
                </button>
            ) : (
                <button
                    onClick={() => navigate('/matches/create')}
                    className="px-8 py-3 rounded-full bg-primary text-background text-xs font-extrabold uppercase tracking-widest shadow-[0_0_20px_#38ff1444] transition-all active:scale-95"
                >
                    Create a Match
                </button>
            )}
        </div>
    );

    // Filter Navigation
    const setTab = (tab) => {
        haptics.light();
        setSearchParams({ tab });
        lastDocRef.current = null;
    };

    const buildQuery = useCallback((afterDoc = null) => {
        const coll = currentTab === 'matches' ? 'matches' : 'matchRequests';
        let constraints = [];

        if (currentTab === 'matches') {
            constraints.push(where('status', 'in', ['open', 'locked']));
        } else {
            constraints.push(where('status', '==', 'open'));
            constraints.push(where('expiresAt', '>', new Date().toISOString()));
        }

        if (format !== 'All') constraints.push(where('format', '==', format));
        if (skillLevel !== 'All') constraints.push(where('skillLevel', '==', skillLevel));

        if (currentTab === 'matches') {
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
        }

        const orderField = currentTab === 'matches' ? (sortBy === 'time_asc' ? 'kickoffTime' : 'spotsLeft') : 'expiresAt';
        const orderDir = (currentTab === 'matches' && sortBy === 'time_asc') || currentTab === 'requests' ? 'asc' : 'desc';

        constraints.push(orderBy(orderField, orderDir));
        constraints.push(limit(PAGE_SIZE));

        if (afterDoc) constraints.push(startAfter(afterDoc));

        return query(collection(db, coll), ...constraints);
    }, [format, skillLevel, timeFilter, sortBy, currentTab]);

    const fetchMatches = useCallback(async (reset = false) => {
        const cacheKey = `${currentTab}-${format}-${skillLevel}-${timeFilter}-${sortBy}`;

        if (reset) {
            setLoading(true);
            setError(null);
            lastDocRef.current = null;

            if (queryCache.has(cacheKey)) {
                const cached = queryCache.get(cacheKey);
                if (currentTab === 'matches') setMatches(cached.items);
                else setRequests(cached.items);
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
            const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
            const more = snapshot.docs.length === PAGE_SIZE;

            if (reset) {
                if (currentTab === 'matches') setMatches(newItems);
                else setRequests(newItems);
                queryCache.set(cacheKey, { items: newItems, lastDoc, hasMore: more });
            } else {
                if (currentTab === 'matches') setMatches(prev => [...prev, ...newItems]);
                else setRequests(prev => [...prev, ...newItems]);
            }

            lastDocRef.current = lastDoc;
            setHasMore(more);
        } catch (err) {
            console.error('MatchFeed error:', err);
            setError(err.message || 'Failed to load feed.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [buildQuery, format, skillLevel, timeFilter, sortBy, currentTab]);

    useEffect(() => {
        fetchMatches(true);
    }, [format, skillLevel, timeFilter, sortBy, currentTab, fetchMatches]);

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
        <div className="flex flex-col min-h-screen bg-background text-white font-display">
            {/* DEBUG MARKER - Visible if component renders */}
            <div className="fixed top-0 left-0 z-[9999] bg-primary text-background text-[10px] font-bold px-2 py-1">
                Pitch Hub Loaded
            </div>

            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden shadow-[0_0_10px_rgba(56,255,20,0.2)]">
                            {currentUser?.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="material-symbols-outlined text-primary text-xl">person</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold leading-none tracking-tight">Pitch Hub</h1>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">London, UK</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className={`size-10 rounded-full flex items-center justify-center transition-all ${showFilters || hasFilters
                            ? 'bg-primary text-background shadow-[0_0_15px_#38ff14]'
                            : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">tune</span>
                    </button>
                </div>

                {/* Segmented Control */}
                <div className="flex p-1 bg-white/5 rounded-full mb-4 border border-white/5">
                    <button
                        onClick={() => setTab('matches')}
                        className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${currentTab === 'matches'
                            ? 'bg-primary text-background shadow-lg scale-[1.02]'
                            : 'text-white/40 hover:text-white'
                            }`}
                    >
                        Matches
                    </button>
                    <button
                        onClick={() => setTab('requests')}
                        className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${currentTab === 'requests'
                            ? 'bg-primary text-background shadow-lg scale-[1.02]'
                            : 'text-white/40 hover:text-white'
                            }`}
                    >
                        Requests
                    </button>
                </div>

                {/* Active Filter Bar (Horizontal Scroll) */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    <button
                        onClick={() => setShowFilters(true)}
                        className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all ${format !== 'All' ? 'bg-primary/20 border border-primary/40 text-primary' : 'bg-white/5 border border-white/10 text-white/40'}`}
                    >
                        Format: {format} <span className="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                    <button
                        onClick={() => setShowFilters(true)}
                        className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all ${skillLevel !== 'All' ? 'bg-primary/20 border border-primary/40 text-primary' : 'bg-white/5 border border-white/10 text-white/40'}`}
                    >
                        Skill: {skillLevel} <span className="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                    <button
                        onClick={() => setShowFilters(true)}
                        className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all ${timeFilter !== 'All' ? 'bg-primary/20 border border-primary/40 text-primary' : 'bg-white/5 border border-white/10 text-white/40'}`}
                    >
                        Time: {timeFilter} <span className="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 px-4 py-4 space-y-4">
                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-secondary/40 border border-white/5 rounded-3xl p-5 space-y-4">
                                <div>
                                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Users size={10} /> Format
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {FORMATS.map(f => (
                                            <FilterChip key={`format-${f}`} label={f} active={format === f} onClick={() => { haptics.light(); setFormat(f); }} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Zap size={10} /> Skill Level
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {SKILL_LEVELS.map(s => (
                                            <FilterChip key={`skill-${s}`} label={s} active={skillLevel === s} onClick={() => { haptics.light(); setSkillLevel(s); }} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Clock size={10} /> When
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {TIME_FILTERS.map(t => (
                                            <FilterChip key={`time-${t}`} label={t} active={timeFilter === t} onClick={() => { haptics.light(); setTimeFilter(t); }} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Sort By</p>
                                    <div className="flex gap-2">
                                        {SORT_OPTIONS.map(s => (
                                            <FilterChip key={`sort-${s.value}`} label={s.label} active={sortBy === s.value} onClick={() => { haptics.light(); setSortBy(s.value); }} />
                                        ))}
                                    </div>
                                </div>
                                {hasFilters && (
                                    <button
                                        onClick={() => { haptics.medium(); clearFilters(); }}
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

                {/* List Body */}
                <div>
                    {loading ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map((i) => <MatchSkeleton key={`skel-main-${i}`} />)}
                        </div>
                    ) : (currentTab === 'matches' ? matches : requests).length === 0 ? (
                        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                    ) : (
                        <MotionList className="grid gap-4">
                            {(currentTab === 'matches' ? matches : requests).map((item) => (
                                <div key={item.id}>
                                    {currentTab === 'matches' ? (
                                        <MatchCard
                                            {...item}
                                            joined={item.joined_players?.length || 0}
                                        />
                                    ) : (
                                        <RequestCard
                                            request={item}
                                        />
                                    )}
                                </div>
                            ))}
                        </MotionList>
                    )}
                </div>

                {/* Sentinel */}
                {!loading && hasMore && (
                    <div ref={loaderRef} className="flex justify-center py-4">
                        {loadingMore && <Loader2 size={24} className="animate-spin text-primary" />}
                    </div>
                )}

                {!loading && !hasMore && (currentTab === 'matches' ? matches : requests).length > 0 && (
                    <p className="text-center text-white/20 text-xs font-bold uppercase tracking-widest py-4">
                        You've seen all {currentTab}
                    </p>
                )}
            </main>

            <button
                onClick={() => navigate(currentTab === 'matches' ? '/matches/create' : '/matches/request')}
                className="fixed bottom-24 right-6 z-40 size-16 rounded-full bg-primary text-background flex items-center justify-center shadow-[0_8px_32px_rgba(56,255,20,0.4)] transition-transform active:scale-95 group"
            >
                <span className="material-symbols-outlined text-3xl font-bold group-hover:rotate-90 transition-transform">add</span>
            </button>
        </div>
    );
}
