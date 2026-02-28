import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/userModel.js";

import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://twikit-com.vercel.app", "https://twiikit-com.vercel.app", "http://localhost:5173", "https://twikit.online", "https://www.twikit.online", "https://twikit-6lhw6lbeg-prince-mishras-projects-eb04834b.vercel.app", "*"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

import { setIO, userSocketMap, getReceiverSocketId } from "./socketIO.js";
setIO(io);

// const userSocketMap = {}; // Moved to socketIO.js

// export const getReceiverSocketId = (receiverId) => {
//   return userSocketMap[receiverId];
// };


// 🔒 MANDATORY JWT AUTHENTICATION MIDDLEWARE
// Supports both: auth object (React Native) AND cookies (Web)
io.use(async (socket, next) => {
  try {
    // 1️⃣ First, check auth object (React Native sends token here)
    let token = socket.handshake.auth?.token;

    // 2️⃣ Fallback: check cookies (Web browsers send token here)
    if (!token) {
      const cookieString = socket.request.headers.cookie;
      if (cookieString) {
        const cookies = Object.fromEntries(
          cookieString.split(';').map(c => {
            const [key, ...v] = c.split('=');
            return [key.trim(), v.join('=')];
          })
        );
        token = cookies.token;
      }
    }

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

const getOnlineUserIds = () => {
  const onlineIds = [];
  for (const [userId, socketId] of Object.entries(userSocketMap)) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.user && socket.user.showOnlineStatus) {
      onlineIds.push(userId);
    }
  }
  return onlineIds;
};

export const broadcastOnlineUsers = () => {
  io.emit("getOnlineUser", getOnlineUserIds());
};

// Allow controller to update the socket's user object directly
export const updateUserSocketData = (userId, data) => {
  const socketId = userSocketMap[userId];
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.user) {
      socket.user = { ...socket.user, ...data };
      broadcastOnlineUsers(); // Re-broadcast immediately
    }
  }
};

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

    broadcastOnlineUsers();
  }

  socket.on("disconnect", async () => {
    delete userSocketMap[userId];
    broadcastOnlineUsers();

    // Update lastSeen (Only if they were "technically" online, or always? Always is fine for DB)
    try {
      const module = await import("../models/userModel.js");
      const User = module.default;
      await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
    } catch (err) {
      // console.log("Error updating lastSeen:", err);
    }
  });
});

export { app, server, io };
