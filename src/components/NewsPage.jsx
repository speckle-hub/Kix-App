import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./Button";

const RSS_FEEDS = [
    "https://www.espn.com/espn/rss/soccer/news",
    "https://feeds.bbc.co.uk/sport/football/rss.xml",
    "https://www.skysports.com/feeds/rss/football.xml"
];

// Using rss2json API to bypass CORS
const RSS__API_BASE = "https://api.rss2json.com/v1/api.json?rss_url=";

export function NewsPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNews = async () => {
        try {
            setLoading(true);
            setError(null);

            const feedPromises = RSS_FEEDS.map(feed =>
                fetch(`${RSS__API_BASE}${encodeURIComponent(feed)}`).then(res => res.json())
            );

            const results = await Promise.all(feedPromises);

            let allArticles = [];
            results.forEach(result => {
                if (result.status === 'ok') {
                    const sourceTitle = result.feed.title;
                    const items = result.items.map(item => ({
                        ...item,
                        source: sourceTitle,
                        id: item.guid || item.link, // Fallback ID
                        // Safe date parsing
                        pubDateObj: new Date(item.pubDate)
                    }));
                    allArticles = [...allArticles, ...items];
                }
            });

            // Sort by date (newest first)
            allArticles.sort((a, b) => b.pubDateObj - a.pubDateObj);

            // Limit to 50 recent articles
            setNews(allArticles.slice(0, 50));

        } catch (err) {
            console.error("News fetch error:", err);
            setError("Failed to load news. Please try again later.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNews();
    };

    // Helper to format date "2 hours ago"
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div className="min-h-screen bg-background text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-condensed font-bold italic">
                        LATEST <span className="text-primary">NEWS</span>
                    </h1>
                    <p className="text-xs text-white/60">Global Football Updates</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading || refreshing}
                    className={`p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={20} className="text-primary" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading && !refreshing ? (
                    // Skeletons
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                            <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
                            <div className="h-32 bg-white/10 rounded mb-3"></div>
                            <div className="h-3 bg-white/10 rounded w-1/2"></div>
                        </div>
                    ))
                ) : error ? (
                    <div className="text-center py-20 px-6">
                        <AlertCircle size={48} className="mx-auto text-red-500 mb-4 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">Could not load news</h3>
                        <p className="text-white/60 mb-6">{error}</p>
                        <Button onClick={fetchNews} variant="outline">Try Again</Button>
                    </div>
                ) : (
                    news.map((article, index) => (
                        <motion.a
                            key={article.id}
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="block bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all active:scale-[0.98]"
                        >
                            {/* Article Image (if using thumbnail from RSS enclosure or description parsing) */}
                            {article.thumbnail && (
                                <div className="h-48 w-full overflow-hidden relative">
                                    <img
                                        src={article.thumbnail}
                                        alt={article.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.style.display = 'none'} // Hide broken images
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                </div>
                            )}

                            <div className="p-4">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                            {article.source.split(' ')[0]} {/* Simple source tag */}
                                        </span>
                                        <span className="text-[10px] text-white/40">
                                            {timeAgo(article.pubDateObj)}
                                        </span>
                                    </div>
                                    <ExternalLink size={14} className="text-white/20" />
                                </div>

                                <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2">
                                    {article.title}
                                </h3>

                                {/* Description stripping HTML tags simply */}
                                <p className="text-sm text-white/60 line-clamp-3">
                                    {article.content ? article.content.replace(/<[^>]+>/g, '') : article.description?.replace(/<[^>]+>/g, '')}
                                </p>
                            </div>
                        </motion.a>
                    ))
                )}

                {!loading && !error && news.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <Newspaper size={48} className="mx-auto mb-4" />
                        <p>No news available right now.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
