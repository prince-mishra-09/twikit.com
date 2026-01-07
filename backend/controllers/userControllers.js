import User from "../models/userModel.js";
import Notification from "../models/Notification.js";
import tryCatch from "../utils/tryCatch.js";
import bcrypt from 'bcrypt'
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";
import { sendPushNotification } from "./notificationController.js";
import { io } from "../socket/socket.js";

export const myProfile = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("mutedUsers", "name profilePic")
    .populate("blockedUsers", "name profilePic");

  res.json(user);
});

export const userProfile = async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const user = await User.findById(req.params.id).select("-password");

  if (!user) return res.status(404).json({ message: "User Not Found" });

  // CHECK BLOCK STATUS
  // 1. If I blocked them
  if (req.user.blockedUsers.includes(user._id)) {
    return res.status(404).json({ message: "User Not Found" });
  }
  // 2. If they blocked me
  if (user.blockedUsers.includes(req.user._id)) {
    return res.status(404).json({ message: "User Not Found" });
  }

  res.json(user);
};





export const followAndUnfollowUser = tryCatch(async (req, res) => {
  const user = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);

  if (!user)
    return res.status(404).json({
      message: "No User with is id",
    });

  if (user._id.toString() === loggedInUser._id.toString())
    return res.status(400).json({
      message: "You can't follow yourself",
    });

  if (user.followers.includes(loggedInUser._id)) {
    // UNFOLLOW LOGIC (Always allowed)
    const indexFollowing = loggedInUser.followings.indexOf(user._id);
    const indexFollower = user.followers.indexOf(loggedInUser._id);

    loggedInUser.followings.splice(indexFollowing, 1);
    user.followers.splice(indexFollower, 1);

    await loggedInUser.save();
    await user.save();

    res.json({
      message: "User Unfollowed",
    });
  } else {
    // FOLLOW LOGIC
    // Check if request already sent
    if (user.followRequests.includes(loggedInUser._id)) {
      return res.status(400).json({ message: "Request already sent" });
    }

    if (user.isPrivate) {
      // PRIVATE ACCOUNT: Send Request
      user.followRequests.push(loggedInUser._id);
      await user.save();

      const notification = await Notification.create({
        receiver: user._id,
        sender: loggedInUser._id,
        type: "follow_request",
        actionRequired: true,
      });

      await notification.populate("sender", "name profilePic");

      io.to(user._id.toString()).emit("notification:new", notification);

      return res.json({ message: "Follow Request Sent" });
    }

    // PUBLIC ACCOUNT: Follow directly
    loggedInUser.followings.push(user._id);
    user.followers.push(loggedInUser._id);

    await loggedInUser.save();
    await user.save();

    // NOTIFICATION LOGIC
    const notification = await Notification.create({
      receiver: user._id,
      sender: loggedInUser._id,
      type: "follow",
    });

    io.to(user._id.toString()).emit("notification:new", notification);

    res.json({
      message: "User Followed",
    });
  }

  // Real-time update
  io.emit("userFollowed", {
    followerId: loggedInUser._id,
    followingId: user._id,
  });
})


export const userFollowerandFollowingData = tryCatch(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("followers", "-password")
    .populate("followings", "-password");

  const followers = user.followers;
  const followings = user.followings;

  res.json({
    followers,
    followings,
  });
});

export const updateProfile = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { name } = req.body;

  if (name) {
    user.name = name;
  }

  const file = req.file;
  if (file) {
    const fileUrl = getDataUrl(file);

    await cloudinary.v2.uploader.destroy(user.profilePic.id);

    const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content);

    user.profilePic.id = myCloud.public_id;
    user.profilePic.url = myCloud.secure_url;
  }

  await user.save();

  res.json({
    message: "Profile updated",
  });
});


export const updatePassword = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { oldPassword, newPassword } = req.body;

  const comparePassword = await bcrypt.compare(oldPassword, user.password);

  if (!comparePassword)
    return res.status(400).json({ message: "Wrong old password" });

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  res.json({ message: "Password Updated" });
});



export const searchUsers = tryCatch(async (req, res) => {
  const search = req.query.search || "";

  if (!search.trim()) {
    return res.json([]);
  }

  const users = await User.find({
    name: { $regex: search, $options: "i" },
    _id: { $ne: req.user._id, $nin: req.user.blockedUsers },
    blockedUsers: { $ne: req.user._id }
  }).select("name profilePic");

  res.json(users);
});



export const getSavedPosts = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "savedPosts",
    populate: {
      path: "owner",
      select: "-password",
    },
  });

  // Since savedPosts is an array, we might want to reverse it to show newest saved first,
  // or depending on how they were pushed. Pushing adds to end, so reverse for LIFO.
  let savedPosts = user.savedPosts.reverse();

  // 0. Fetch users who have BLOCKED the current user ('blockedBy')
  const blockedByUsers = await User.find({ blockedUsers: req.user._id }).distinct('_id');

  // 1. Combine with users I have BLOCKED
  const blockedUsers = req.user.blockedUsers || [];

  // Create a Set of all hidden User IDs (both blocked and blockedBy)
  const hiddenUserIds = [
    ...blockedUsers.map(id => id.toString()),
    ...blockedByUsers.map(id => id.toString())
  ];

  // Filter out posts from blocked/blocking users
  savedPosts = savedPosts.filter((post) => {
    return !hiddenUserIds.includes(post.owner._id.toString());
  });

  // Sanitize engagement within saved posts
  savedPosts = savedPosts.map(post => {
    // Filter Likes
    if (post.likes && post.likes.length > 0) {
      post.likes = post.likes.filter(id => id && !hiddenUserIds.includes(id.toString()));
    }
    // Filter Comments
    if (post.comments && post.comments.length > 0) {
      post.comments = post.comments.filter(comment => {
        if (!comment.user) return false;
        const commentUserId = comment.user._id ? comment.user._id.toString() : comment.user.toString();
        return !hiddenUserIds.includes(commentUserId);
      });
    }
    return post;
  });

  res.json(savedPosts);
});

export const acceptFollowRequest = tryCatch(async (req, res) => {
  const userId = req.params.id; // The user who sent the request
  const loggedInUser = await User.findById(req.user._id); // The receiver (me)
  const sender = await User.findById(userId);

  if (!sender) return res.status(404).json({ message: "User not found" });

  // Remove from requests
  if (loggedInUser.followRequests.includes(sender._id)) {
    const index = loggedInUser.followRequests.indexOf(sender._id);
    loggedInUser.followRequests.splice(index, 1);
  }

  // Add to followers/following
  if (!loggedInUser.followers.includes(sender._id)) {
    loggedInUser.followers.push(sender._id);
  }
  if (!sender.followings.includes(loggedInUser._id)) {
    sender.followings.push(loggedInUser._id);
  }

  await loggedInUser.save();
  await sender.save();

  // Update Notification & Emit Update
  const requestNotification = await Notification.findOneAndUpdate(
    { sender: sender._id, receiver: loggedInUser._id, type: "follow_request" },
    { type: "follow", actionRequired: false, isRead: true },
    { new: true }
  ).populate("sender", "name profilePic");

  if (requestNotification) {
    io.to(loggedInUser._id.toString()).emit("notification:update", requestNotification);
  }

  // Notify Sender that request was accepted
  const notification = await Notification.create({
    receiver: sender._id,
    sender: loggedInUser._id,
    type: "request_accepted",
    isRead: false
  });

  await notification.populate("sender", "name profilePic");

  io.to(sender._id.toString()).emit("notification:new", notification);

  // Real-time Follow Update for Receiever (Me)
  io.to(loggedInUser._id.toString()).emit("userFollowed", {
    followerId: sender._id,
    followingId: loggedInUser._id,
  });

  // Real-time Follow Update for Sender (Them)
  io.to(sender._id.toString()).emit("userFollowed", {
    followerId: sender._id,
    followingId: loggedInUser._id,
  });

  res.json({ message: "Request Accepted" });
});

export const rejectFollowRequest = tryCatch(async (req, res) => {
  const userId = req.params.id;
  const loggedInUser = await User.findById(req.user._id);

  // Remove from requests
  if (loggedInUser.followRequests.includes(userId)) {
    const index = loggedInUser.followRequests.indexOf(userId);
    loggedInUser.followRequests.splice(index, 1);
    await loggedInUser.save();
  }

  // Update Notification & Emit Update
  const requestNotification = await Notification.findOneAndDelete({
    sender: userId,
    receiver: loggedInUser._id,
    type: "follow_request"
  });

  if (requestNotification) {
    io.to(loggedInUser._id.toString()).emit("notification:delete", requestNotification._id);
  }

  res.json({ message: "Request Rejected" });
});

export const togglePrivacy = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.isPrivate = !user.isPrivate;
  await user.save();

  res.json({
    message: user.isPrivate ? "Account is now Private" : "Account is now Public",
    isPrivate: user.isPrivate
  });
});

export const removeFollower = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id); // Me
  const followerToRemove = await User.findById(req.params.id); // The person following me

  if (!followerToRemove) return res.status(404).json({ message: "User not found" });

  // Remove from my followers
  if (user.followers.includes(followerToRemove._id)) {
    const index = user.followers.indexOf(followerToRemove._id);
    user.followers.splice(index, 1);
    await user.save();
  }

  // Remove me from their followings
  if (followerToRemove.followings.includes(user._id)) {
    const index = followerToRemove.followings.indexOf(user._id);
    followerToRemove.followings.splice(index, 1);
    await followerToRemove.save();
  }

  res.json({ message: "Follower Removed" });
});

export const blockUser = tryCatch(async (req, res) => {
  const userToBlock = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);

  if (!userToBlock) return res.status(404).json({ message: "User not found" });

  if (loggedInUser.blockedUsers.includes(userToBlock._id)) {
    return res.status(400).json({ message: "User already blocked" });
  }

  // Atomically remove all relationships
  // 1. Remove from followers/following
  loggedInUser.followers = loggedInUser.followers.filter(id => id.toString() !== userToBlock._id.toString());
  loggedInUser.followings = loggedInUser.followings.filter(id => id.toString() !== userToBlock._id.toString());

  userToBlock.followers = userToBlock.followers.filter(id => id.toString() !== loggedInUser._id.toString());
  userToBlock.followings = userToBlock.followings.filter(id => id.toString() !== loggedInUser._id.toString());

  // 2. Remove Follow Requests
  loggedInUser.followRequests = loggedInUser.followRequests.filter(id => id.toString() !== userToBlock._id.toString());
  userToBlock.followRequests = userToBlock.followRequests.filter(id => id.toString() !== loggedInUser._id.toString());

  // 3. Add to Blocked List 
  loggedInUser.blockedUsers.push(userToBlock._id);

  await loggedInUser.save();
  await userToBlock.save();

  // 4. Delete Notifications
  await Notification.deleteMany({
    $or: [
      { sender: loggedInUser._id, receiver: userToBlock._id },
      { sender: userToBlock._id, receiver: loggedInUser._id }
    ]
  });

  res.json({ message: "User blocked successfully" });
});

export const unblockUser = tryCatch(async (req, res) => {
  const userToUnblock = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);

  if (!userToUnblock) return res.status(404).json({ message: "User not found" });

  if (!loggedInUser.blockedUsers.includes(userToUnblock._id)) {
    return res.status(400).json({ message: "User is not blocked" });
  }

  loggedInUser.blockedUsers = loggedInUser.blockedUsers.filter(id => id.toString() !== userToUnblock._id.toString());

  await loggedInUser.save();

  res.json({ message: "User unblocked successfully" });
});
