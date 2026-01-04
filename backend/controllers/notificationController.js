import { Notification } from "../models/Notification.js";
import TryCatch from "../utils/tryCatch.js";

export const getNotifications = TryCatch(async (req, res) => {
    const notifications = await Notification.find({ receiver: req.user._id })
        .populate("sender", "name profilePic")
        .populate("postId", "post")
        .sort({ createdAt: -1 });

    res.json(notifications);
});

export const getUnreadCount = TryCatch(async (req, res) => {
    const count = await Notification.countDocuments({
        receiver: req.user._id,
        isRead: false,
    });

    res.json({ count });
});

export const markAsRead = TryCatch(async (req, res) => {
    await Notification.updateMany(
        { receiver: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    res.json({ message: "Notifications marked as read" });
});
