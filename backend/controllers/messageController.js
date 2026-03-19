import { Chat } from "../models/chatModel.js";
import { Messages } from "../models/messagesModel.js";
import { getReceiverSocketId, getIO } from "../socket/socketIO.js";
import { Notification } from "../models/Notification.js";
import TryCatch from "../utils/tryCatch.js";
import { sendPushNotification } from "./notificationController.js";
import { Post } from "../models/postModel.js";
import User from "../models/userModel.js";

export const sendMessage = TryCatch(async (req, res) => {
  const { recieverId, message, sharedContent, replyTo } = req.body;

  const senderId = req.user._id;

  if (!recieverId)
    return res.status(400).json({
      message: "Please give reciever id",
    });

  const receiver = await User.findById(recieverId);
  if (!receiver) return res.status(404).json({ message: "User not found" });

  // 1. BLOCK CHECK
  if (receiver.blockedUsers.includes(senderId)) {
    return res.status(403).json({ message: "You cannot message this user" });
  }

  // 2. PRIVACY CHECK (Recipient must be public OR sender must be a follower)
  if (receiver.isPrivate && receiver._id.toString() !== senderId.toString()) {
    if (!receiver.followers.includes(senderId)) {
      return res.status(403).json({ message: "Follow this user to send messages" });
    }
  }

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
    // Populate users to avoid frontend crash
    await chat.populate("users", "name username profilePic lastSeen showLastSeen updatedAt");

    const chatObj = chat.toObject();
    chatObj.users = chatObj.users.map(u => {
      if (u.showLastSeen === false) {
        u.lastSeen = null;
      }
      return u;
    });

    const otherUser = chatObj.users.find(
      (u) => u._id.toString() !== senderId.toString()
    );

    return res.status(200).json({
      ...chatObj,
      users: [otherUser], // Return only the other user for consistency
    });
  }

  const newMessage = new Messages({
    chatId: chat._id,
    sender: senderId,
    text: message,
    sharedContent,
    replyTo,
  });

  await newMessage.save();

  // Populate replyTo for socket emission
  await newMessage.populate({
    path: "replyTo",
    populate: { path: "sender", select: "name username" },
  });

  await chat.updateOne({
    latestMessage: {
      text: message || (sharedContent ? "Shared content" : "Attachment"),
      sender: senderId,
    },
    updatedAt: new Date(),
  });

  const reciverSocketId = getReceiverSocketId(recieverId);

  if (reciverSocketId) {
    getIO().to(reciverSocketId).emit("newMessage", newMessage);
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
  }).populate({
    path: "replyTo",
    populate: { path: "sender", select: "name username" },
  });

  // Dynamic Accessibility Check for Shared Content
  const processedMessages = await Promise.all(messages.map(async (msg) => {
    if (!msg.sharedContent || !msg.sharedContent.contentId) return msg;

    const { type, contentId } = msg.sharedContent;
    let isAccessible = true;

    try {
      if (type === "post" || type === "reel") {
        const post = await Post.findById(contentId).populate("owner");
        if (!post) isAccessible = false;
        else {
          const owner = post.owner;
          if (owner.isPrivate && owner._id.toString() !== userId.toString()) {
            const user = await User.findById(userId);
            if (!user.followings.includes(owner._id.toString())) {
              isAccessible = false;
            }
          }
          // Block check
          if (owner.blockedUsers && owner.blockedUsers.includes(userId)) isAccessible = false;
        }
      } else if (type === "profile") {
        const profileUser = await User.findById(contentId);
        if (!profileUser) isAccessible = false;
        else {
          if (profileUser.isPrivate && profileUser._id.toString() !== userId.toString()) {
            const user = await User.findById(userId);
            if (!user.followings.includes(profileUser._id.toString())) {
              isAccessible = false;
            }
          }
          if (profileUser.blockedUsers && profileUser.blockedUsers.includes(userId)) isAccessible = false;
        }
      }
    } catch (error) {
      isAccessible = false;
    }

    if (!isAccessible) {
      // Return a copy with restricted content
      const obscuredMsg = msg.toObject();
      obscuredMsg.sharedContent = {
        ...obscuredMsg.sharedContent,
        isRestricted: true,
        contentId: null // Remove ID to prevent frontend fetching
      };
      return obscuredMsg;
    }

    return msg;
  }));

  res.json(processedMessages);
});

export const getAllChats = TryCatch(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.aggregate([
    // 1. Find chats where current user is a participant
    { $match: { users: userId } },
    // 2. Join with users collection for participant details
    {
      $lookup: {
        from: "users",
        localField: "users",
        foreignField: "_id",
        as: "participantDetails"
      }
    },
    // 3. Count unread messages for each chat from other users
    {
      $lookup: {
        from: "messages",
        let: { chatId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$chatId", "$$chatId"] },
                  { $ne: ["$sender", userId] },
                  { $eq: ["$isRead", false] }
                ]
              }
            }
          }
        ],
        as: "unreadMessages"
      }
    },
    // 4. Project required fields
    {
      $project: {
        _id: 1,
        latestMessage: 1,
        updatedAt: 1,
        unreadCount: { $size: "$unreadMessages" },
        users: {
          $filter: {
            input: "$participantDetails",
            as: "u",
            cond: { $ne: ["$$u._id", userId] }
          }
        }
      }
    },
    // 5. Clean up user fields (equivalent to select('-password'))
    {
      $project: {
        "users.password": 0,
        "users.__v": 0,
        "users.blockedUsers": 0,
        "users.mutedUsers": 0,
        "users.savedPosts": 0,
        "users.email": 0,
        // Ensure updatedAt is EXPLICITLY kept or not deleted
      }
    },
    // 6. Sort by latest interaction
    { $sort: { updatedAt: -1 } },
    // 7. Data Sanitization (Last Seen Privacy)
    {
      $project: {
        _id: 1,
        latestMessage: 1,
        updatedAt: 1,
        unreadCount: 1,
        users: {
          $map: {
            input: "$users",
            as: "u",
            in: {
              $mergeObjects: [
                "$$u",
                {
                  lastSeen: {
                    $cond: {
                      if: { $eq: ["$$u.showLastSeen", false] },
                      then: null,
                      else: "$$u.lastSeen"
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  ]);

  res.json(chats);
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
        getIO().to(otherUserSocketId).emit("messagesRead", { chatId, readerId: userId });
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
        getIO().to(receiverSocketId).emit("messageDeleted", { messageId: id, chatId: message.chatId });
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

export const toggleReaction = TryCatch(async (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  const message = await Messages.findById(id);
  if (!message) return res.status(404).json({ message: "Message not found" });

  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.user.toString() === userId.toString()
  );

  if (existingReactionIndex !== -1) {
    if (message.reactions[existingReactionIndex].emoji === emoji) {
      // Remove reaction if same emoji
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Update reaction if different emoji
      message.reactions[existingReactionIndex].emoji = emoji;
    }
  } else {
    // Add new reaction
    message.reactions.push({ user: userId, emoji });
  }

  await message.save();

  // Populate reactions for socket update
  await message.populate("reactions.user", "name username profilePic updatedAt");

  // Notify participants via Socket
  const chat = await Chat.findById(message.chatId);
  if (chat) {
    chat.users.forEach((uId) => {
      const socketId = getReceiverSocketId(uId);
      if (socketId) {
        getIO().to(socketId).emit("messageReactionUpdated", {
          messageId: id,
          chatId: message.chatId,
          reactions: message.reactions,
        });
      }
    });
  }

  res.json(message.reactions);
});
