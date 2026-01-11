import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    isRead: {
      type: Boolean,
      default: false,
    },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sharedContent: {
      type: {
        type: String,
        enum: ["post", "reel", "profile"],
      },
      contentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "sharedContent.type", // Dynamic ref logic if supported, or just use ID and manual populate
      },
      preview: {
        title: String,
        image: String,
        username: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Messages = mongoose.model("Messages", messageSchema);