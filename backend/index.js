import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import express from "express";
import { app, server } from "./socket/socket.js";
import { connectDB } from "./database/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";

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

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/story", storyRoutes);

app.get("/", (req, res) => {
  res.send("TWIKIT API RUNNING");
});

// server start (ONLY PLACE)
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
