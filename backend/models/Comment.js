import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        comment: {
            type: String,
            required: true,
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },
    },
    { timestamps: true }
);

// Indexes for performance optimization
commentSchema.index({ post: 1, createdAt: -1 }); // Post's comments sorted by date
commentSchema.index({ user: 1 }); // User's comments
commentSchema.index({ parentComment: 1 }); // Replies to a comment

export const Comment = mongoose.model("Comment", commentSchema);
