import redis from "../lib/redisClient.js";

export function rateLimit({ keyPrefix = 'rate:signup', maxAttempts = 5, windowSeconds = 60 }) {
    return async (req, res, next) => {
        try {
            // Skip rate limiting in development mode
            if (process.env.NODE_ENV === 'development') {
                console.log('[RATE LIMIT] Skipped in development mode');
                return next();
            }

            // Extract user IP
            const ip = req.ip || req.headers['x-forwarded-for'] || '';

            if (!ip) {
                console.warn('[RATE LIMIT] Could not extract IP address. Skipping.');
                return next();
            }

            // Create Redis key using IP
            const redisKey = `${keyPrefix}:${ip}`;

            // Increment attempts count in Redis
            const attempts = await redis.incr(redisKey);

            // Set TTL if it's the first attempt
            if (attempts === 1) {
                await redis.expire(redisKey, windowSeconds);
            }

            // Exceeded max attempts
            if (attempts > maxAttempts) {
                return res.status(429).json({
                    message: 'Too many requests. Please try again later.'
                });
            }

            // Continue to next middleware
            next();
        } catch (err) {
            console.error('[RATE LIMIT ERROR]', err);
            next(); // Let request through in case of Redis failure
        }
    };
}
