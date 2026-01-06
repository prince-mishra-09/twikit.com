import { Chat } from "../models/chatModel.js";
import { Messages } from "../models/messagesModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { Notification } from "../models/Notification.js";
import TryCatch from "../utils/tryCatch.js";

export const sendMessage = TryCatch(async (req, res) => {
  const { recieverId, message } = req.body;

  const senderId = req.user._id;

  if (!recieverId)
    return res.status(400).json({
      message: "Please give reciever id",
    });

  let chat = await Chat.findOne({
    users: { $all: [senderId, recieverId] },
  });

  if (!chat) {
    chat = new Chat({
      users: [senderId, recieverId],
      latestMessage: {
        text: message || "New Chat",
        sender: senderId,
      },
    });

    await chat.save();
  }

  // IF NO MESSAGE, JUST RETURN CHAT (For "Start Chat" feature)
  if (!message) {
    return res.status(200).json({ message: "Chat initiated", chat });
  }

  const newMessage = new Messages({
    chatId: chat._id,
    sender: senderId,
    text: message,
  });

  await newMessage.save();

  await chat.updateOne({
    latestMessage: {
      text: message,
      sender: senderId,
    },
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
