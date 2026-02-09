
import Redis from "ioredis";
import { RedisMemoryServer } from "redis-memory-server";

let redisClient;
let memoryServer;
let isInitializing = true;

// 1. Create a Proxy to handle the dynamic checking/swapping of the client
const redisProxy = new Proxy({}, {
    get: function (target, prop) {
        // If we have a client, forward the access
        if (redisClient) {
            // If the property is a function, bind it to the client
            if (typeof redisClient[prop] === 'function') {
                return redisClient[prop].bind(redisClient);
            }
            return redisClient[prop];
        }

        // If no client yet, return a safe dummy function to prevent crashes
        // Most Redis calls are async functions (get, set, del), so we return an async function.
        if (isInitializing) {
            return async () => {
                console.warn(`Redis '${String(prop)}' command skipped: Client initializing...`);
                return null;
            };
        }

        return undefined;
    }
});

const initializeRedis = async () => {
    try {
        let redisHost = process.env.REDIS_HOST || "127.0.0.1";

        // Sanitize host
        if (redisHost.startsWith("http://") || redisHost.startsWith("https://")) {
            redisHost = redisHost.replace(/^https?:\/\//, "");
        }

        const options = {
            host: redisHost,
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => {
                // In Development, fail fast to switch to Memory Server
                if (process.env.NODE_ENV !== "production" && times > 2) {
                    return null; // Stop retrying, trigger 'end'/'error'
                }
                return Math.min(times * 50, 2000);
            },
        };

        // Attempt initial connection
        const candidateClient = new Redis(options);

        // Temporarily set as client to attempt connection
        // (If it fails immediately, error handler will swap it)
        redisClient = candidateClient;

        candidateClient.on("connect", () => {
            console.log("Redis Connected Successfully 🚀");
            isInitializing = false;
        });

        candidateClient.on("error", async (err) => {
            console.error("Redis Connection Error:", err.message);

            if ((err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") && process.env.NODE_ENV !== "production") {
                // If we are already setting up memory server, ignore
                if (memoryServer) return;

                console.log("⚠️ Local Redis not found. Starting In-Memory Redis Server...");

                try {
                    redisClient = null; // Temporarily clear faulty client
                    isInitializing = true;

                    memoryServer = new RedisMemoryServer();
                    const host = await memoryServer.getHost();
                    const port = await memoryServer.getPort();

                    console.log(`✅ In-Memory Server Started at ${host}:${port}`);

                    // Create new client for memory server
                    const memoryClient = new Redis({ host, port });

                    memoryClient.on("connect", () => {
                        console.log(`✅ Connected to In-Memory Redis (${host}:${port})`);
                        redisClient = memoryClient; // Swap the active client
                        isInitializing = false;
                    });

                    memoryClient.on("error", (memErr) => {
                        console.error("In-Memory Redis Client Error:", memErr);
                    });

                } catch (memError) {
                    console.error("Failed to start In-Memory Redis:", memError);
                    isInitializing = false;
                }
            } else {
                // Non-fallback error
                isInitializing = false;
            }
        });

    } catch (error) {
        console.error("Redis Setup Error:", error);
        isInitializing = false;
    }
};

initializeRedis();

export default redisProxy;
