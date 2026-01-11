import { Chat } from "../models/chatModel.js";
import { Messages } from "../models/messagesModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { Notification } from "../models/Notification.js";
import TryCatch from "../utils/tryCatch.js";
import { sendPushNotification } from "./notificationController.js";
import { Post } from "../models/postModel.js";
import User from "../models/userModel.js";

export const sendMessage = TryCatch(async (req, res) => {
  const { recieverId, message, sharedContent } = req.body;

  const senderId = req.user._id;

  if (!recieverId)
    return res.status(400).json({
      message: "Please give reciever id",
    });

  /* PRIVACY CHECK FOR SHARED CONTENT */
  if (sharedContent) {
    const { type, contentId } = sharedContent;

    if (type === "post" || type === "reel") {
      const post = await Post.findById(contentId).populate("owner");
      if (!post) return res.status(404).json({ message: "Content not found" });

      const owner = post.owner;

      // 1. SENDER CHECK: Sender must follow owner (or be owner)
      if (owner.isPrivate && owner._id.toString() !== senderId.toString()) {
        const senderUser = await User.findById(senderId); // Should be in req.user, but ensuring fresh data
        if (!senderUser.followings.includes(owner._id.toString())) {
          return res.status(403).json({ message: "You cannot share this private content" });
        }
      }

      // 2. RECEIVER CHECK: Receiver must follow owner (or be owner)
      if (owner.isPrivate && owner._id.toString() !== recieverId.toString()) {
        const receiverUser = await User.findById(recieverId);
        if (!receiverUser.followings.includes(owner._id.toString())) {
          return res.status(403).json({ message: "Receiver follows needed to view this" });
        }
      }
    } else if (type === "profile") {
      const profileUser = await User.findById(contentId);
      if (!profileUser) return res.status(404).json({ message: "User not found" });

      // 1. SENDER CHECK
      if (profileUser.isPrivate && profileUser._id.toString() !== senderId.toString()) {
        const senderUser = await User.findById(senderId);
        if (!senderUser.followings.includes(profileUser._id.toString())) {
          return res.status(403).json({ message: "You cannot share this private profile" });
        }
      }

      // 2. RECEIVER CHECK
      if (profileUser.isPrivate && profileUser._id.toString() !== recieverId.toString()) {
        const receiverUser = await User.findById(recieverId);
        if (!receiverUser.followings.includes(profileUser._id.toString())) {
          return res.status(403).json({ message: "Receiver follows needed to view this" });
        }
      }
    }
  }

  let chat = await Chat.findOne({
    users: { $all: [senderId, recieverId] },
  });

  if (!chat) {
    chat = new Chat({
      users: [senderId, recieverId],
      latestMessage: {
        text: message || (sharedContent ? "Shared content" : "New Chat"),
        sender: senderId,
      },
    });

    await chat.save();
  }

  // IF NO MESSAGE AND NO SHARED CONTENT, JUST RETURN CHAT
  if (!message && !sharedContent) {
    return res.status(200).json({ message: "Chat initiated", chat });
  }

  const newMessage = new Messages({
    chatId: chat._id,
    sender: senderId,
    text: message,
    sharedContent,
  });

  await newMessage.save();

  await chat.updateOne({
    latestMessage: {
      text: message || (sharedContent ? "Shared content" : "Attachment"),
      sender: senderId,
    },
    updatedAt: new Date(),
  });

  const reciverSocketId = getReceiverSocketId(recieverId);

  if (reciverSocketId) {
    io.to(reciverSocketId).emit("newMessage", newMessage);
  }

  /* REMOVED NOTIFICATION LOGIC - Chat has its own flow */
  // const notification = await Notification.create({
  //   receiver: recieverId,
  //   sender: senderId,
  //   type: "message",
  //   messageId: newMessage._id,
  // });
  // io.to(recieverId.toString()).emit("notification:new", notification);

  // SEND PUSH NOTIFICATION
  await sendPushNotification(recieverId, {
    title: "New Message",
    body: `New message from ${req.user.name}`,
    url: `/chat`,
  });

  res.status(201).json(newMessage);
});

export const getAllMessages = TryCatch(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findOne({
    users: { $all: [userId, id] },
  });

  if (!chat)
    return res.status(404).json({
      message: "No Chat with these users",
    });

  const messages = await Messages.find({
    chatId: chat._id,
    deletedBy: { $ne: userId }
  });

  res.json(messages);
});

export const getAllChats = TryCatch(async (req, res) => {
  const userId = req.user._id;

  /* MODIFIED: Include Unread Counts */
  const chats = await Chat.find({
    users: { $in: [userId] },
  })
    .populate("users", "name profilePic lastSeen")
    .sort({ updatedAt: -1 });

  // Add unread count for each chat
  const chatsWithCount = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await Messages.countDocuments({
        chatId: chat._id,
        sender: { $ne: userId },
        isRead: false,
      });

      const otherUser = chat.users.find(
        (u) => u._id.toString() !== userId.toString()
      );

      return {
        ...chat.toObject(),
        users: [otherUser], // Return only the other user
        unreadCount,
      };
    })
  );

  res.json(chatsWithCount);
});


export const markMessageAsRead = TryCatch(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  // Update all messages in this chat sent by OTHER user to isRead: true
  await Messages.updateMany(
    { chatId, sender: { $ne: userId }, isRead: false },
    { $set: { isRead: true } }
  );

  // Notify the sender that their messages were read
  // We need to find the other user in the chat to know who to notify?
  // Actually, we can just find the chat to get the users.
  const chat = await Chat.findById(chatId);
  if (chat) {
    const otherUser = chat.users.find(id => id.toString() !== userId.toString());
    if (otherUser) {
      const otherUserSocketId = getReceiverSocketId(otherUser);
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("messagesRead", { chatId, readerId: userId });
      }
    }
  }

  res.json({ message: "Messages marked as read" });
});

export const deleteMessage = TryCatch(async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // 'unsend' or 'delete'
  const userId = req.user._id;

  const message = await Messages.findById(id);

  if (!message) return res.status(404).json({ message: "Message not found" });

  if (message.sender.toString() !== userId.toString() && type === 'unsend') {
    return res.status(403).json({ message: "You can only unsend your own messages" });
  }

  if (type === "unsend") {
    // Permanent delete (Unsend)
    await message.deleteOne();

    // Notify receiver to remove message
    const chat = await Chat.findById(message.chatId);
    if (chat) {
      const receiverId = chat.users.find(u => u.toString() !== userId.toString());
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", { messageId: id, chatId: message.chatId });
      }
    }
  } else {
    // Delete for me
    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId);
      await message.save();
    }
  }

  res.json({ message: "Message deleted" });
});
