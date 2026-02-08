import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/userModel.js";

import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://twikit-com.vercel.app", "https://twiikit-com.vercel.app", "http://localhost:5173", "https://twikit.online", "https://www.twikit.online", "*"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// 🔒 MANDATORY JWT AUTHENTICATION MIDDLEWARE
io.use(async (socket, next) => {
  try {
    const cookieString = socket.request.headers.cookie;
    if (!cookieString) return next(new Error("Authentication error: No cookies"));

    // Extract token from cookie (handle multiple cookies)
    const cookies = Object.fromEntries(
      cookieString.split(';').map(c => {
        const [key, ...v] = c.split('=');
        return [key.trim(), v.join('=')];
      })
    );

    const token = cookies.token;
    if (!token) return next(new Error("Authentication error: Token missing"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Dynamic import to avoid circular dependency
    const module = await import("../models/userModel.js");
    const User = module.default;

    const user = await User.findById(decoded._id).select("-password");

    if (!user) return next(new Error("Authentication error: User not found"));

    socket.user = user; // Attach verified user to socket
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication error: Invalid Token"));
  }
});

io.on("connection", (socket) => {
  // ✅ Identity is now verified via JWT
  const userId = socket.user._id.toString();

  if (userId) {
    userSocketMap[userId] = socket.id;
    socket.join("user:" + userId); // Join private room based on verified ID

    // Post Room Events
    socket.on("join-post", (postId) => {
      socket.join("post:" + postId);
    });

    socket.on("leave-post", (postId) => {
      socket.leave("post:" + postId);
    });

    // Presence broadcast removed for privacy, can be implemented per-follower if needed
  }

  // socket.emit("getOnlineUser", Object.keys(userSocketMap)); // Removed global leak

  socket.on("disconnect", async () => {
    delete userSocketMap[userId];

    // Presence broadcast removed for privacy

    // Update lastSeen
    try {
      const module = await import("../models/userModel.js");
      const User = module.default;
      await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
    } catch (err) {
      console.log("Error updating lastSeen:", err);
    }
  });
});

export { app, server, io };
