import User from "../models/userModel.js";
import tryCatch from "../utils/tryCatch.js";
import bcrypt from 'bcrypt'
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";

export const myProfile = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password")
  // console.log(req.user);

  res.json(user)
})

export const userProfile = async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const user = await User.findById(req.params.id).select("-password");

  if (!user)
    return res.status(404).json({ message: "User Not Found" });

  res.json(user);
};



import { io } from "../socket/socket.js";
import { Notification } from "../models/Notification.js";

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
    _id: { $ne: req.user._id },
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
  const savedPosts = user.savedPosts.reverse();

  res.json(savedPosts);
});
