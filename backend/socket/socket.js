import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/userModel.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://twiikit-com.vercel.app", "http://localhost:5173", "*"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
    socket.join(userId);
  }

  io.emit("getOnlineUser", Object.keys(userSocketMap));

  socket.on("disconnect", async () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUser", Object.keys(userSocketMap));

    // Update lastSeen
    try {
      // Dynamic import to avoid circular dependency
      // Ensure we get the default export
      const module = await import("../models/userModel.js");
      const User = module.default;

      await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
    } catch (err) {
      console.log("Error updating lastSeen:", err);
    }
  });
});

export { app, server, io };
