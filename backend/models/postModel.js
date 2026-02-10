import mongoose from "mongoose";
import User from "./userModel.js";
const postSchema = new mongoose.Schema({
  caption: String,

  post: {
    id: String,
    url: String,
  },

  type: {
    type: String,
    required: true,
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  vibesUp: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  vibesDown: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  views: {
    type: Number,
    default: 0,
  },

  commentsCount: {
    type: Number,
    default: 0,
  },
});

// Indexes for performance optimization
postSchema.index({ owner: 1, createdAt: -1 }); // User's posts sorted by date (General)
postSchema.index({ type: 1, createdAt: -1 }); // Posts/Reels sorted by date (Feed)
postSchema.index({ createdAt: -1 }); // Feed sorting (Fallback)
postSchema.index({ owner: 1, type: 1, createdAt: -1 }); // User's specific posts/reels sorted (Profile)
postSchema.index({ vibesUp: 1 }); // Performance: Reverse lookup for likes
postSchema.index({ vibesDown: 1 }); // Performance: Reverse lookup for dislikes

export const Post = mongoose.model("Post", postSchema);