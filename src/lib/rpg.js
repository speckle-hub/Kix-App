/**
 * KIX RPG Progression System
 * 
 * XP Sources:
 *   - Match participation: +50 XP
 *   - Check-in (no-show prevention): +10 XP bonus
 *   - Sportsmanship rating 4+: +15 XP bonus
 *   - Hosting a match: +25 XP bonus
 * 
 * Level formula: level = floor(sqrt(xp / 100))
 * XP to next level: (level + 1)^2 * 100
 * 
 * Overall Rating (OVR):
 *   Weighted by position. Caps at 99.
 *   Position weights are defined per position.
 */

export const POSITION_WEIGHTS = {
    ST: { pace: 0.30, shooting: 0.35, passing: 0.10, dribbling: 0.15, physical: 0.10 },
    CF: { pace: 0.25, shooting: 0.30, passing: 0.15, dribbling: 0.20, physical: 0.10 },
    CAM: { pace: 0.15, shooting: 0.20, passing: 0.30, dribbling: 0.25, physical: 0.10 },
    CM: { pace: 0.15, shooting: 0.15, passing: 0.35, dribbling: 0.20, physical: 0.15 },
    CDM: { pace: 0.10, shooting: 0.10, passing: 0.30, dribbling: 0.15, physical: 0.35 },
    LW: { pace: 0.30, shooting: 0.20, passing: 0.15, dribbling: 0.30, physical: 0.05 },
    RW: { pace: 0.30, shooting: 0.20, passing: 0.15, dribbling: 0.30, physical: 0.05 },
    LB: { pace: 0.25, shooting: 0.05, passing: 0.20, dribbling: 0.15, physical: 0.35 },
    RB: { pace: 0.25, shooting: 0.05, passing: 0.20, dribbling: 0.15, physical: 0.35 },
    CB: { pace: 0.15, shooting: 0.05, passing: 0.15, dribbling: 0.10, physical: 0.55 },
    GK: { pace: 0.10, shooting: 0.05, passing: 0.15, dribbling: 0.10, physical: 0.60 },
};

export const DEFAULT_WEIGHTS = { pace: 0.20, shooting: 0.20, passing: 0.20, dribbling: 0.20, physical: 0.20 };

/**
 * Calculate the player's level from XP.
 */
export function xpToLevel(xp = 0) {
    return Math.floor(Math.sqrt(xp / 100));
}

/**
 * XP required to reach the next level.
 */
export function xpForNextLevel(level) {
    return Math.pow(level + 1, 2) * 100;
}

/**
 * XP progress within the current level (0–1).
 */
export function levelProgress(xp = 0) {
    const level = xpToLevel(xp);
    const currentLevelXp = Math.pow(level, 2) * 100;
    const nextLevelXp = xpForNextLevel(level);
    return (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
}

/**
 * Calculate the Overall Rating (OVR) for a player based on position.
 * Stats are capped at 99.
 */
export function calculateOVR(stats, position = 'ST') {
    const weights = POSITION_WEIGHTS[position] || DEFAULT_WEIGHTS;
    const raw =
        (stats.pace || 50) * weights.pace +
        (stats.shooting || 50) * weights.shooting +
        (stats.passing || 50) * weights.passing +
        (stats.dribbling || 50) * weights.dribbling +
        (stats.physical || 50) * weights.physical;
    return Math.min(99, Math.round(raw));
}

/**
 * XP awarded for a completed match.
 */
export function calculateMatchXP({ participated, checkedIn, wasHost, avgRating }) {
    let xp = 0;
    if (participated) xp += 50;
    if (checkedIn) xp += 10;
    if (wasHost) xp += 25;
    if (avgRating >= 4) xp += 15;
    return xp;
}

/**
 * Stat caps per level. Players cannot exceed these values
 * unless they've earned enough XP.
 */
export function getStatCap(level) {
    // Starts at 60, increases by 2 per level, caps at 99
    return Math.min(99, 60 + level * 2);
}

/**
 * Clamp stats to the current level's cap.
 */
export function clampStatsToCap(stats, level) {
    const cap = getStatCap(level);
    return Object.fromEntries(
        Object.entries(stats).map(([k, v]) => [k, Math.min(v, cap)])
    );
}
