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
        text: message,
        sender: senderId,
      },
    });

    await chat.save();
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

  // NOTIFICATION LOGIC
  const notification = await Notification.create({
    receiver: recieverId,
    sender: senderId,
    type: "message",
    messageId: newMessage._id,
  });

  io.to(recieverId.toString()).emit("notification:new", notification);

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
  });

  res.json(messages);
});

export const getAllChats = TryCatch(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({
    users: { $in: [userId] },
  })
    .populate("users", "name profilePic")
    .sort({ updatedAt: -1 });

  // remove logged-in user from users array
  chats.forEach(chat => {
    chat.users = chat.users.filter(
      u => u._id.toString() !== userId.toString()
    );
  });

  res.json(chats);
});
