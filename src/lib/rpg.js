export const XP_PER_MATCH = 50;
export const XP_FOR_HOSTING = 20;
export const XP_FOR_SPORTSMANSHIP = 10;

export const RELIABILITY_ADJUSTMENTS = {
    NO_SHOW: -15,
    LATE_CANCEL: -5,
    HOST_NO_SHOW: -25,
    MATCH_COMPLETED: 2
};

export function calculateNewReliability(current, adjustment) {
    return Math.min(Math.max(current + adjustment, 0), 100);
}

export function getReliabilityTier(score) {
    if (score >= 95) return { label: 'Elite', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
    if (score >= 80) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    if (score >= 60) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
    return { label: 'Unreliable', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' };
}

export function xpToLevel(xp) {
    if (xp >= 1000) return 10;
    if (xp >= 500) return 5;
    if (xp >= 250) return 3;
    if (xp >= 100) return 2;
    return 1;
}

export function getStatCap(level) {
    return 60 + (level * 2);
}

export function clampStatsToCap(stats, level) {
    const cap = getStatCap(level);
    const clamped = {};
    Object.keys(stats).forEach(key => {
        clamped[key] = Math.min(stats[key], cap);
    });
    return clamped;
}

export function calculateOVR(stats, position) {
    const values = Object.values(stats);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
}

export function getXPForNextLevel(level) {
    const thresholds = {
        1: 100, 2: 250, 3: 500, 4: 750, 5: 1000,
        6: 1250, 7: 1500, 8: 1750, 9: 2000, 10: Infinity
    };
    return thresholds[level] || 100;
}

export function getProgressToNextLevel(xp) {
    const currentLevel = xpToLevel(xp);
    if (currentLevel >= 10) return 100;

    const currentLevelThreshold = getLevelThreshold(currentLevel);
    const nextLevelThreshold = getXPForNextLevel(currentLevel);

    const progress = ((xp - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
}

function getLevelThreshold(level) {
    const thresholds = { 1: 0, 2: 100, 3: 250, 4: 500, 5: 750, 6: 1000 };
    return thresholds[level] || 0;
}

export function evaluateBadges(existingBadges = [], stats = {}) {
    const newBadges = [...existingBadges];
    const earnedIds = new Set(existingBadges.map(b => b.id));

    if (!earnedIds.has('first_match') && stats.matchesCompleted >= 1) {
        newBadges.push({ id: 'first_match', earnedAt: Date.now() });
    }
    if (!earnedIds.has('match_legend_10') && stats.matchesCompleted >= 10) {
        newBadges.push({ id: 'match_legend_10', earnedAt: Date.now() });
    }
    if (!earnedIds.has('pro_host') && stats.matchesHosted >= 3) {
        newBadges.push({ id: 'pro_host', earnedAt: Date.now() });
    }
    if (!earnedIds.has('reliable_player') && stats.matchesCompleted >= 5 && stats.reliabilityScore >= 95) {
        newBadges.push({ id: 'reliable_player', earnedAt: Date.now() });
    }

    return newBadges;
}
