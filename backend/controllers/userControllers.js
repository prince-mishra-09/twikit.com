import User from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import { Notification } from "../models/Notification.js";
import tryCatch from "../utils/tryCatch.js";
import bcrypt from 'bcrypt'
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";
import { sendPushNotification } from "./notificationController.js";
import { io } from "../socket/socket.js";

export const myProfile = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("mutedUsers", "name profilePic username")
    .populate("blockedUsers", "name profilePic username");

  res.json(user);
});

export const userProfile = async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const user = await User.findById(req.params.id).select("-password");

  if (!user) return res.status(404).json({ message: "User Not Found" });

  const isGuest = !req.user;

  // CHECK BLOCK STATUS (only for logged in users)
  if (!isGuest) {
    // 1. If I blocked them
    if (req.user.blockedUsers.includes(user._id)) {
      return res.status(404).json({ message: "User Not Found" });
    }
    // 2. If they blocked me
    if (user.blockedUsers.includes(req.user._id)) {
      return res.status(404).json({ message: "User Not Found" });
    }
  }

  // Privacy Check for guests
  if (isGuest && user.isPrivate) {
    return res.status(401).json({ message: "Login required to view private profile" });
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

    // CLEANUP NOTIFICATION
    await Notification.deleteMany({
      sender: loggedInUser._id,
      receiver: user._id,
      type: "follow"
    });

    res.json({
      message: "User Unfollowed",
    });
  } else if (user.followRequests.includes(loggedInUser._id)) {
    // RETRACT REQUEST LOGIC
    const index = user.followRequests.indexOf(loggedInUser._id);
    user.followRequests.splice(index, 1);
    await user.save();

    // CLEANUP NOTIFICATION
    await Notification.deleteMany({
      sender: loggedInUser._id,
      receiver: user._id,
      type: "follow_request"
    });

    res.json({ message: "Follow Request Retracted" });
  } else {
    // FOLLOW LOGIC
    // ... (Existing logic for follow/request)
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

      await notification.populate("sender", "name profilePic username");

      io.to(user._id.toString()).emit("notification:new", notification);

      // SEND PUSH NOTIFICATION
      await sendPushNotification(user._id, {
        title: "New Follow Request",
        body: `${loggedInUser.name} wants to follow you`,
        url: `/notifications`,
      });

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

    // SEND PUSH NOTIFICATION
    await sendPushNotification(user._id, {
      title: "New Follower",
      body: `${loggedInUser.name} started following you`,
      url: `/notifications`,
    });

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
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) return res.status(404).json({ message: "User not found" });

  const isGuest = !req.user;
  const isOwner = !isGuest && req.user._id.toString() === targetUser._id.toString();
  const isFollower = !isGuest && targetUser.followers.includes(req.user._id);

  // Privacy Check: Only owner or followers can see the list if private
  if (targetUser.isPrivate && !isOwner && !isFollower) {
    return res.status(403).json({ message: "This account is private. Follow to see followers." });
  }

  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("followers", "name username profilePic bio isPrivate")
    .populate("followings", "name username profilePic bio isPrivate");

  const followers = user.followers;
  const followings = user.followings;

  res.json({
    followers,
    followings,
  });
});

export const updateProfile = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { name, bio, link, username } = req.body;

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (link !== undefined) user.link = link;

  if (username) {
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: "Invalid username format" });
    }

    if (username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username;
    }
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
  const searchRaw = req.query.search || "";
  const search = searchRaw.replace(/^@/, "").trim();

  const isGuest = !req.user;

  if (!search && !req.query.restrictToFollowersOf) {
    return res.json({ users: [], posts: [] });
  }

  const regex = new RegExp(search, "i");

  const query = {
    isPrivate: false // Default to public only for search if guest
  };

  if (!isGuest) {
    delete query.isPrivate; // Authenticated users can see more (depending on blocking)
    query._id = { $ne: req.user._id, $nin: req.user.blockedUsers };
    query.blockedUsers = { $ne: req.user._id };
  }

  if (search) {
    query.$or = [
      { name: regex },
      { username: regex }
    ];
  }

  if (req.query.restrictToFollowersOf && !isGuest) {
    const targetUser = await User.findById(req.query.restrictToFollowersOf);
    if (targetUser) {
      if (!query._id) query._id = {};
      query._id.$in = targetUser.followers;
    }
  }

  const users = await User.find(query).select("name username profilePic bio isPrivate");

  // Priority Sort: Exact Username > StartsWith Username > Name
  users.sort((a, b) => {
    const aU = a.username || "";
    const bU = b.username || "";
    if (aU === search && bU !== search) return -1;
    if (bU === search && aU !== search) return 1;
    if (aU.startsWith(search) && !bU.startsWith(search)) return -1;
    if (bU.startsWith(search) && !aU.startsWith(search)) return 1;
    return 0;
  });

  // Fetch posts from top results
  const topUserIds = users.slice(0, 10).map(u => u._id);

  let posts = await Post.find({
    owner: { $in: topUserIds }
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("owner", "name username profilePic isPrivate");

  // Sanitize reflections for privacy
  posts = posts.map(post => {
    const isOwner = !isGuest && post.owner._id.toString() === req.user._id.toString();
    if (!isOwner) {
      post.reflections = [];
    }
    return post;
  });

  res.json({ users, posts });
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
    const isOwner = post.owner._id.toString() === req.user._id.toString();

    // Filter Reals
    if (post.reals && post.reals.length > 0) {
      post.reals = post.reals.filter(id => id && !hiddenUserIds.includes(id.toString()));
    }

    // Filter Reflections
    if (isOwner) {
      if (post.reflections && post.reflections.length > 0) {
        post.reflections = post.reflections.filter(id => id && !hiddenUserIds.includes(id.toString()));
      }
    } else {
      post.reflections = [];
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
  ).populate("sender", "name profilePic username");

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

  await notification.populate("sender", "name profilePic username");

  io.to(sender._id.toString()).emit("notification:new", notification);

  // SEND PUSH NOTIFICATION
  await sendPushNotification(sender._id, {
    title: "Request Accepted",
    body: `${loggedInUser.name} accepted your follow request`,
    url: `/notifications`,
  });

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

  // 5. Cleanup Feedback (Remove blocked user's feedback from my posts)
  await Post.updateMany(
    { owner: loggedInUser._id },
    { $pull: { reals: userToBlock._id, reflections: userToBlock._id } }
  );

  // 6. Cleanup Feedback (Remove my feedback from blocked user's posts)
  await Post.updateMany(
    { owner: userToBlock._id },
    { $pull: { reals: loggedInUser._id, reflections: loggedInUser._id } }
  );

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
