import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        refreshToken: {
            type: String,
            required: true,
            unique: true,
        },
        userAgent: {
            type: String,
        },
        ipAddress: {
            type: String,
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index: auto-delete when expiresAt is reached
        },
    },
    { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
