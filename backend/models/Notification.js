import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["real", "reflect", "comment", "follow", "message", "follow_request", "request_accepted", "comment_reply"],
            required: true,
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        relatedComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        actionRequired: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes for performance optimization
notificationSchema.index({ receiver: 1, createdAt: -1 }); // User's notifications sorted by date
notificationSchema.index({ receiver: 1, isRead: 1 }); // Unread notifications filter
notificationSchema.index({ sender: 1 }); // Notifications sent by user

export const Notification = mongoose.model("Notification", notificationSchema);
