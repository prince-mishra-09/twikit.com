import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mediaUrl: {
        type: String,     // Optional: text-only stories possible
    },
    text: {
        type: String,     // Optional: media-only stories possible
    },
    viewers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true, // Efficient querying for non-expired stories
    },
});

export const Story = mongoose.model("Story", storySchema);
