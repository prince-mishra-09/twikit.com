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

// WEB PUSH CONFIGURATION
import webPush from "web-push";
import User from "../models/userModel.js";

// Initialize Web Push with keys from .env
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
        process.env.VAPID_MAILTO || "mailto:test@example.com",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export const subscribeToPush = TryCatch(async (req, res) => {
    const subscription = req.body;

    // Save subscription to user's pushSubscriptions array if not already present
    // We try to avoid duplicates based on endpoint
    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { pushSubscriptions: subscription }
    });

    res.status(201).json({ message: "Subscription added" });
});

// Internal helper to send push notifications to a user
export const sendPushNotification = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

        const notificationPayload = JSON.stringify(payload);

        const promises = user.pushSubscriptions.map(async (sub) => {
            try {
                await webPush.sendNotification(sub, notificationPayload);
            } catch (error) {
                // If endpoint is gone (410) or expired, remove it
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await User.findByIdAndUpdate(userId, {
                        $pull: { pushSubscriptions: { endpoint: sub.endpoint } }
                    });
                }
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
};
