import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  getAllChats,
  getAllMessages,
  sendMessage,
} from "../controllers/messageController.js";

const router = express.Router();

// 🔥 VERY IMPORTANT: /chats must come BEFORE /:id
router.get("/chats", isAuth, getAllChats);
router.post("/", isAuth, sendMessage);
router.get("/:id", isAuth, getAllMessages);

export default router;
