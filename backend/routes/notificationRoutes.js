import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/all", isAuth, getNotifications);
router.get("/unread", isAuth, getUnreadCount);
router.put("/read", isAuth, markAsRead);

export default router;
