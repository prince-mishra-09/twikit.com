import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import { RedisMemoryServer } from "redis-memory-server";

let redisClient;
let memoryServer;
let isInitializing = true;

// 1. Create a Proxy to handle the dynamic checking/swapping of the client
const redisProxy = new Proxy({}, {
    get: function (target, prop) {
        if (redisClient) {
            // COMPATIBILITY LAYER: Intercept 'set' to handle argument differences
            if (prop === 'set') {
                return async (...args) => {
                    // Reliable Upstash Detection: Use same env var as initialization
                    const isUpstash = !!process.env.UPSTASH_REDIS_REST_URL;

                    // Logic: If using Upstash AND args match (key, val, "EX", ttl) -> Convert to object syntax
                    if (isUpstash && args.length >= 4 && typeof args[2] === 'string' && args[2].toUpperCase() === 'EX') {
                        const [key, value, _mode, ttl] = args;
                        const options = { ex: ttl };

                        // Check for NX flag
                        if (args.length >= 5 && typeof args[4] === 'string' && args[4].toUpperCase() === 'NX') {
                            options.nx = true;
                        }

                        return redisClient.set(key, value, options);
                    }

                    // Fallback to original call (for IORedis)
                    return redisClient.set(...args);
                };
            }

            // Bind functions to the client instance
            if (typeof redisClient[prop] === 'function') {
                return redisClient[prop].bind(redisClient);
            }
            return redisClient[prop];
        }

        if (isInitializing) {
            return async () => {
                console.warn(`Redis '${String(prop)}' command skipped: Client initializing...`);
                return null;
            };
        }

        // FAIL-SAFE: If initialization finished but no client (connection failed),
        // return a safe no-op function to allow the app to function (Cache Miss behavior).
        if (!redisClient) {
            return async () => {
                if (process.env.NODE_ENV !== "production") {
                    console.warn(`Redis '${String(prop)}' command call ignored: Redis client not connected.`);
                }
                return null;
            };
        }

        return undefined;
    }
});

const initializeRedis = async () => {
    try {
        console.log("Checking Redis Config...");
        console.log("UPSTASH_URL:", process.env.UPSTASH_REDIS_REST_URL ? "Set" : "Missing");
        console.log("UPSTASH_TOKEN:", process.env.UPSTASH_REDIS_REST_TOKEN ? "Set" : "Missing");

        // STRATEGY 1: Check for Upstash REST (HTTP)
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            console.log("Found Upstash Credentials. Initializing HTTP Client...");

            const upstashClient = new UpstashRedis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });

            // Test Connection
            try {
                await upstashClient.get("ping"); // Simple REST call
                console.log("✅ Redis Connected Successfully (Upstash HTTP) 🚀");
                redisClient = upstashClient;
                isInitializing = false;
                return;
            } catch (err) {
                console.error("❌ Upstash Connection Failed:", err.message);
                // Fallthrough to local/ioredis if Upstash fails (unlikely if env exists)
            }
        }

        // STRATEGY 2: Fallback to IORedis (TCP / Local)
        let redisHost = process.env.REDIS_HOST || "127.0.0.1";

        if (redisHost.startsWith("http://") || redisHost.startsWith("https://")) {
            redisHost = redisHost.replace(/^https?:\/\//, "");
        }

        const options = {
            host: redisHost,
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => {
                if (process.env.NODE_ENV !== "production" && times > 2) {
                    return null;
                }
                return Math.min(times * 50, 2000);
            },
        };

        const candidateClient = new Redis(options);
        redisClient = candidateClient;

        candidateClient.on("connect", () => {
            console.log("✅ Redis Connected Successfully (IORedis TCP) 🚀");
            isInitializing = false;
        });

        candidateClient.on("error", async (err) => {
            console.error("Redis Connection Error:", err.message);

            if ((err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") && process.env.NODE_ENV !== "production") {
                if (memoryServer) return;

                console.log("⚠️ Local Redis not found. Starting In-Memory Redis Server...");

                try {
                    redisClient = null;
                    isInitializing = true;

                    memoryServer = new RedisMemoryServer();
                    const host = await memoryServer.getHost();
                    const port = await memoryServer.getPort();

                    console.log(`✅ In-Memory Server Started at ${host}:${port}`);

                    const memoryClient = new Redis({ host, port });

                    memoryClient.on("connect", () => {
                        console.log(`✅ Connected to In-Memory Redis (${host}:${port})`);
                        redisClient = memoryClient;
                        isInitializing = false;
                    });

                } catch (memError) {
                    console.error("Failed to start In-Memory Redis:", memError);
                    isInitializing = false;
                }
            } else {
                isInitializing = false;
            }
        });

    } catch (error) {
        console.error("Redis Setup Error:", error);
        isInitializing = false;
    }
};

export { initializeRedis };
export default redisProxy;
// End of file
