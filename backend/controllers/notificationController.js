import { Notification } from "../models/Notification.js";
import TryCatch from "../utils/tryCatch.js";

export const getNotifications = TryCatch(async (req, res) => {
    const notifications = await Notification.find({ receiver: req.user._id })
        .populate("sender", "name profilePic username")
        .populate("postId", "post type")
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
// Initialize Web Push with keys from .env
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
        (process.env.VAPID_MAILTO || "mailto:test@example.com").trim(),
        process.env.VAPID_PUBLIC_KEY.trim(),
        process.env.VAPID_PRIVATE_KEY.trim()
    );
}

export const subscribeToPush = TryCatch(async (req, res) => {
    const subscription = req.body;

    const user = await User.findById(req.user._id);

    // Check if subscription with this endpoint already exists
    const alreadySubscribed = user.pushSubscriptions.some(
        (sub) => sub.endpoint === subscription.endpoint
    );

    if (!alreadySubscribed) {
        user.pushSubscriptions.push(subscription);
        await user.save();
    }

    res.status(201).json({ message: "Subscription added" });
});

import { getReceiverSocketId } from "../socket/socket.js";

// Internal helper to send push notifications to a user
export const sendPushNotification = async (userId, payload) => {
    try {
        // 1. Suppression Logic: Don't send push if user is online (socket connected)
        const isOnline = getReceiverSocketId(userId.toString());
        if (isOnline) {
            // console.log(`User ${userId} is online, skipping push notification.`);
            return;
        }

        const user = await User.findById(userId);
        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

        const notificationPayload = JSON.stringify(payload);

        // 2. Deduplication Logic: Filter unique endpoints
        const uniqueSubscriptions = [];
        const seenEndpoints = new Set();

        for (const sub of user.pushSubscriptions) {
            if (!seenEndpoints.has(sub.endpoint)) {
                seenEndpoints.add(sub.endpoint);
                uniqueSubscriptions.push(sub);
            }
        }

        // 3. Send Notifications
        const promises = uniqueSubscriptions.map(async (sub) => {
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
