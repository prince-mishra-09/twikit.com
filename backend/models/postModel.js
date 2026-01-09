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

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  commentsCount: {
    type: Number,
    default: 0,
  },
});

export const Post = mongoose.model("Post", postSchema);