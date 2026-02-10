import express from "express";
import redis from "../utils/redis.js";

const router = express.Router();

router.get("/test-redis", async (req, res) => {
    try {
        const count = await redis.incr("test_counter");
        const value = await redis.get("test_counter");
        res.json({
            message: "Redis Test Successful",
            count,
            value,
            clientType: process.env.UPSTASH_REDIS_REST_URL ? "Upstash HTTP" : "Standard TCP"
        });
    } catch (error) {
        console.error("Redis Test Error:", error);
        res.status(500).json({
            message: "Redis Test Failed",
            error: error.message
        });
    }
});

export default router;
