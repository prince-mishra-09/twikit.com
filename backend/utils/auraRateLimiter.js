import redis from './redis.js';

/**
 * Check if user has exceeded Aura X posting rate limit (3 per 24h)
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} { allowed: boolean, remaining: number, resetIn: number }
 */
export const checkAuraRateLimit = async (userId) => {
    const key = `aurax:rate:${userId}`;

    try {
        const count = await redis.get(key);
        const currentCount = count ? parseInt(count) : 0;

        // Maximum 3 posts per 24 hours
        const MAX_POSTS = 24;

        if (currentCount >= MAX_POSTS) {
            // Get TTL to inform user when they can post again
            const ttl = await redis.ttl(key);
            return {
                allowed: false,
                remaining: 0,
                resetIn: ttl > 0 ? ttl : 0
            };
        }

        return {
            allowed: true,
            remaining: MAX_POSTS - currentCount,
            resetIn: 0
        };
    } catch (error) {
        console.error('Redis rate limit check error:', error);
        // Fail open - allow posting if Redis is down
        return { allowed: true, remaining: 3, resetIn: 0 };
    }
};

/**
 * Increment Aura X posting counter
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Number>} New count
 */
export const incrementAuraRateLimit = async (userId) => {
    const key = `aurax:rate:${userId}`;

    try {
        const newCount = await redis.incr(key);

        // Set 24h expiry on first post
        if (newCount === 1) {
            await redis.expire(key, 86400); // 24 hours in seconds
        }

        return newCount;
    } catch (error) {
        console.error('Redis rate limit increment error:', error);
        return 0;
    }
};

/**
 * Check if user has already viewed an Aura (deduplication)
 * @param {String} auraId - AuraX post ID
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Boolean>} true if this is a new view
 */
export const recordAuraView = async (auraId, userId) => {
    const key = `aurax:views:${auraId}`;

    try {
        // Check if user already viewed (0 = already member, 1 = new member)
        const isNewView = await redis.sadd(key, userId);

        // Set 10 minute TTL on the set
        if (isNewView === 1) {
            await redis.expire(key, 600);
        }

        return isNewView === 1;
    } catch (error) {
        console.error('Redis view tracking error:', error);
        // Fail open - count the view
        return true;
    }
};

/**
 * Check if user has already vibed an Aura (prevent double-vibe)
 * @param {String} auraId - AuraX post ID
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} vibeType - 'vibeUp' or 'vibeKill'
 * @returns {Promise<Boolean>} true if user hasn't vibed yet
 */
export const checkAuraVibe = async (auraId, userId, vibeType) => {
    const key = `aurax:${vibeType}:${auraId}`;

    try {
        const isMember = await redis.sismember(key, userId);
        return isMember === 0; // 0 = not member (can vibe), 1 = already vibed
    } catch (error) {
        console.error('Redis vibe check error:', error);
        // Fail open - allow vibe
        return true;
    }
};

/**
 * Record a vibe action in Redis
 * @param {String} auraId - AuraX post ID
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} vibeType - 'vibeUp' or 'vibeKill'
 */
export const recordAuraVibe = async (auraId, userId, vibeType) => {
    const key = `aurax:${vibeType}:${auraId}`;

    try {
        await redis.sadd(key, userId);
        // Set 24h + 1h buffer TTL (outlive the Aura itself)
        await redis.expire(key, 90000); // 25 hours
    } catch (error) {
        console.error('Redis vibe recording error:', error);
    }
};

/**
 * Remove a vibe action from Redis (on un-vibe)
 * @param {String} auraId - AuraX post ID
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} vibeType - 'vibeUp' or 'vibeKill'
 */
export const removeAuraVibe = async (auraId, userId, vibeType) => {
    const key = `aurax:${vibeType}:${auraId}`;

    try {
        await redis.srem(key, userId);
    } catch (error) {
        console.error('Redis vibe removal error:', error);
    }
};
