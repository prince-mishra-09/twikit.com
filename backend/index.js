import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import express from "express";
import { app, server, io } from "./socket/socket.js";
import { connectDB } from "./database/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import { migrateUsernames } from "./utils/migration.js";

// Import monitoring system
import MonitoringService from "./monitoring/index.js";
import metricsMiddleware from "./middleware/metricsMiddleware.js";

dotenv.config();

// cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// middlewares
app.use(
  cors({
    origin: ["https://twiikit-com.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize monitoring system
const monitoringService = new MonitoringService(io);

// Add metrics middleware (must be before routes)
app.use(metricsMiddleware(monitoringService.getMetricsCollector()));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/comment", commentRoutes);

// Monitoring metrics endpoint (optional - for debugging)
app.get("/api/metrics", (req, res) => {
  const metrics = monitoringService.getCurrentMetrics();
  res.json(metrics);
});

app.get("/", (req, res) => {
  res.send("Server is working");
});

// server start (ONLY PLACE)
const port = process.env.PORT || 5000;

server.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await connectDB();
  await migrateUsernames();

  // Start monitoring system after server starts
  setTimeout(() => {
    monitoringService.start();
  }, 5000); // Wait 5 seconds for DB connection
  console.log(`Server running on http://localhost:${port}`);
});
