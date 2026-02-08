import Redis from "ioredis";
import { RedisMemoryServer } from "redis-memory-server";

let redis;
let redisServer;

const connectRedis = async () => {
    try {
        // 1. Try connecting to standard Redis (e.g., localhost:6379)
        redis = new Redis({
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => {
                // In Production, retry forever. In Dev, fail fast to switch to Memory Server.
                if (process.env.NODE_ENV !== "production" && times > 2) return null;
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 1, // Fail fast for initial connection
        });

        redis.on("error", async (err) => {
            if (err.code === "ECONNREFUSED" && process.env.NODE_ENV !== "production") {
                // 2. Fallback: Start In-Memory Server if local Redis is missing
                if (!redisServer) {
                    console.log("⚠️ Local Redis not found. Starting In-Memory Redis Server...");
                    redisServer = new RedisMemoryServer();
                    const host = await redisServer.getHost();
                    const port = await redisServer.getPort();

                    // Re-initialize client to connect to in-memory server
                    redis = new Redis({ host, port });
                    redis.on("connect", () => console.log(`✅ Connected to In-Memory Redis (${host}:${port})`));
                }
            } else {
                console.error("Redis Error:", err);
            }
        });

        redis.on("connect", () => {
            console.log("Redis Connected Successfully 🚀");
        });

    } catch (error) {
        console.error("Redis Setup Error:", error);
    }
};

// Initialize
connectRedis();

// Export a proxy to ensure we always use the active instance (since re-assignment might happen)
const redisProxy = new Proxy({}, {
    get: function (target, prop) {
        if (!redis) return undefined;
        return redis[prop];
    }
});

export default redis; // Exporting the proxy is tricky with ioredis structure, safer to export the instance or wrapper.

// Simpler Export: Just export the instance.
// Note: ES6 modules export live bindings, so 'redis' will point to the new instance if updated?
// No, 'export default' exports the value. We need a wrapper or just rely on the first instance handling errors gracefully?
// Actually, 'ioredis' client creates a connection. If we change 'redis' variable, imports won't see it.
// SOLUTION: We must stick to one 'redis' instance or export a getter.

// REVISED APPROACH for simplicity and robustness:
// We cannot easily hot-swap the exported 'redis' instance in ES6 modules.
// Instead, we should check for Redis BEFORE creating the client, OR use a wrapper class.
// BUT, 'redis-memory-server' is async. 'ioredis' constructor is sync.
//
// BETTER STRATEGY:
// Export a singleton that internally handles the connection, or just start memory server FIRST if dev?

// Let's try starting Memory Server FIRST if we suspect no redis, or just always try to connect?
// User wants "Enable it".
// Let's rewrite this file to be an async initializer or export a wrapper.

