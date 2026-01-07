import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    subscribeToPush,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/all", isAuth, getNotifications);
router.get("/unread", isAuth, getUnreadCount);
router.put("/read", isAuth, markAsRead);
router.post("/subscribe", isAuth, subscribeToPush);

export default router;
