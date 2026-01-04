import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  getAllChats,
  getAllMessages,
  sendMessage,
  markMessageAsRead,
} from "../controllers/messageController.js";

const router = express.Router();

// 🔥 VERY IMPORTANT: /chats must come BEFORE /:id
router.get("/chats", isAuth, getAllChats);
router.post("/", isAuth, sendMessage);
router.put("/read/:chatId", isAuth, markMessageAsRead); // New Route
router.get("/:id", isAuth, getAllMessages);

export default router;
