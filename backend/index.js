import dotenv from "dotenv"; // Restart trigger
import path from "path";
import fs from "fs";
import { startAuraCleanupService } from "./services/auraCleanupService.js";

const envPath = path.resolve(process.cwd(), ".env");
console.log("Current Working Directory:", process.cwd());
console.log("Looking for .env at:", envPath);

if (fs.existsSync(envPath)) {
  console.log("✅ .env file found!");
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error("❌ Error loading .env:", result.error);
  } else {
    console.log("✅ .env loaded successfully");
  }
} else {
  console.error("❌ .env file NOT found at this path!");
  // Fallback to default
  dotenv.config();
}

import cookieParser from "cookie-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { app, server, io } from "./socket/socket.js";
import { connectDB } from "./database/db.js";
import { initializeRedis } from "./utils/redis.js"; // Import init function

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import auraXRoutes from "./routes/auraXRoutes.js";
import { migrateUsernames } from "./utils/migration.js";

// Import monitoring system
import MonitoringService from "./monitoring/index.js";
import metricsMiddleware from "./middleware/metricsMiddleware.js";

// trust proxy - required for secure cookies behind reverse proxies (Render, Vercel, etc.)
app.set("trust proxy", 1);

// cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// middlewares
const allowedOrigins = [
  "https://twikit-com.vercel.app",
  "https://twiikit-com.vercel.app",
  "https://twikit.online",
  "https://www.twikit.online",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

// Security Headers
app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
      // Match common local network IP patterns (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const isLocalNetwork = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);

      if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost || isLocalNetwork) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// TODO: In production, replace the allowedOrigins array with the single production domain
// to strictly limit access, rather than allowing localhost/network IPs.

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fix for Express 5 & express-mongo-sanitize compatibility
// Express 5 makes req.query a getter-only property by default, which causes mongoSanitize to crash
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: req.query,
    writable: true,
    enumerable: true,
    configurable: true,
  });
  next();
});

app.use(mongoSanitize()); // Prevent NoSQL Injection

// Initialize monitoring system
const monitoringService = new MonitoringService(io);

// Add metrics middleware (must be before routes)
app.use(metricsMiddleware(monitoringService.getMetricsCollector()));

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs (login/OTP)
  message: "Too many attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/aurax", auraXRoutes);
import testRoutes from "./routes/testRoutes.js";
app.use("/api/test", testRoutes);
// Monitoring metrics endpoint (protected - briefly checks key or similar if needed)
app.get("/api/metrics", async (req, res) => {
  // Secure check using Authorization Header
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.JWT_SECRET}`) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const metrics = await monitoringService.getCurrentMetrics();
  res.json(metrics);
});

app.get("/", (req, res) => {
  res.send("Server is working");
});

// Health Check Endpoint for Uptime Monitors
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message
  });
});

// server start (ONLY PLACE)
const port = process.env.PORT || 5000;

server.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

  // CRITICAL: Check for required environment variables
  if (!process.env.MONGO_CONNECTION) {
    console.error("FATAL ERROR: MONGO_CONNECTION is not defined in environment variables.");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1);
  }

  await connectDB();
  await initializeRedis(); // Explicitly init Redis after env vars are ready
  await migrateUsernames();


  // Start monitoring system after server starts
  setTimeout(() => {
    monitoringService.start();
    // Start Aura Archival Service (Check every 1 minute)
    startAuraCleanupService(60 * 1000);
  }, 5000); // Wait 5 seconds for DB connection
  console.log(`Server running on:`);
  console.log(`- Local:   http://localhost:${port}`);
  console.log(`- Network: Use your PC's IP address (e.g., http://192.168.x.x:${port}) for real devices`);

  // Prevent Cold Starts (Render/Fly.io Free Tier)
  // Ping the server every 14 minutes (840000 ms)
  if (process.env.NODE_ENV === "production") {
    const keepAliveURL = process.env.BASE_URL || `http://localhost:${port}`;
    console.log(`⏰ Keep-Alive system active. Pinging ${keepAliveURL}/health every 14 mins.`);

    setInterval(async () => {
      try {
        await fetch(`${keepAliveURL}/health`);
        // console.log("Ping successful"); // Uncomment for debugging
      } catch (error) {
        console.error("Keep-Alive Ping Failed:", error.message);
      }
    }, 840000);
  }
});
