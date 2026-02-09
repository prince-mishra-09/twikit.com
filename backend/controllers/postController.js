import { Post } from "../models/postModel.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import TryCatch from "../utils/tryCatch.js";
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";
import { io } from "../socket/socket.js";
import { Notification } from "../models/Notification.js";
import { sendPushNotification } from "./notificationController.js";

export const newPost = TryCatch(async (req, res) => {
    const { caption } = req.body;
    const ownerId = req.user._id;
    const file = req.file;
    const type = req.query.type;

    if (type !== 'story' && (!caption || caption.trim() === "")) {
        return res.status(400).json({ message: "Caption is required" });
    }

    if (!file) {
        return res.status(400).json({ message: "No file provided" });
    }

    // 1. Send Immediate Response (Optimistic)
    res.status(202).json({
        message: "Post upload started",
        status: "processing",
    });

    // 2. Process in Background (Non-blocking)
    setImmediate(async () => {
        try {
            const fileUrl = getDataUrl(file);
            const option = type === "reel" ? { resource_type: "video" } : {};

            // Heavy: Cloudinary Upload
            const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, option);

            // Heavy: DB Creation
            const post = await Post.create({
                caption,
                post: {
                    id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                owner: ownerId,
                type,
            });

            // Populate for frontend (match getAllPosts projection)
            await post.populate("owner", "name username profilePic isPrivate");

            // 3. Emit "Ready" Event to User
            io.to("user:" + ownerId.toString()).emit("post:ready", post);

        } catch (error) {
            console.error("Background Upload Error:", error);

            // Emit "Failed" Event
            io.to("user:" + ownerId.toString()).emit("post:failed", {
                message: "Post upload failed",
                error: error.message || "Unknown error"
            });
        }
    });
});

export const deletePost = TryCatch(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post)
        return res.status(404).json({
            message: "No post with this id",
        });

    if (post.owner.toString() !== req.user._id.toString())
        return res.status(403).json({
            message: "Unauthorized",
        });

    await cloudinary.v2.uploader.destroy(post.post.id);

    // CLEANUP RELATED DATA
    await Notification.deleteMany({ postId: post._id });
    const { Comment } = await import("../models/Comment.js"); // Dynamic import to avoid cycles
    await Comment.deleteMany({ post: post._id });

    await post.deleteOne();

    res.json({
        message: "Post Deleted",
    });
});

export const getAllPosts = TryCatch(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const isGuest = !req.user;
    let userId = null;
    let hiddenUserObjectIds = [];
    let mutedUserObjectIds = [];
    let hiddenPostIds = [];

    if (!isGuest) {
        userId = req.user._id;
        const user = await User.findById(userId);
        const blockedByUsers = await User.find({ blockedUsers: userId }).distinct('_id');

        hiddenUserObjectIds = [
            ...(user.blockedUsers || []),
            ...blockedByUsers
        ].map(id => new mongoose.Types.ObjectId(id));

        mutedUserObjectIds = (user.mutedUsers || []).map(id => new mongoose.Types.ObjectId(id));
        hiddenPostIds = (user.hiddenPosts || []);
    }

    const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

    // 1. Initial Document Filter (Blocking & Muting & Hidden Posts)
    const initialMatch = {};
    if (!isGuest) {
        const excludedOwners = [...hiddenUserObjectIds, ...mutedUserObjectIds];
        if (excludedOwners.length > 0) {
            initialMatch.owner = { $nin: excludedOwners };
        }
        if (hiddenPostIds.length > 0) {
            initialMatch._id = { $nin: hiddenPostIds };
        }
    }

    // 2. Privacy Filter Pipeline (Runs after lookup)
    const privacyMatch = {
        $match: {
            $or: [
                { "owner.isPrivate": false }, // Public Account
                ...(userObjectId ? [
                    { "owner._id": userObjectId }, // My own posts
                    { "owner.followers": userObjectId } // I am a follower
                ] : [])
            ]
        }
    };

    // 3. Projection Stage (Optimization & Sanitization)
    const projectStage = {
        $project: {
            caption: 1,
            post: 1,
            type: 1,
            createdAt: 1,
            views: 1,
            commentsCount: 1,
            owner: {
                _id: 1,
                name: 1,
                username: 1,
                profilePic: 1,
                isPrivate: 1
            },
            vibesUp: {
                $filter: {
                    input: "$vibesUp",
                    as: "r",
                    cond: { $not: { $in: ["$$r", hiddenUserObjectIds] } }
                }
            },
            vibesDown: {
                $cond: {
                    if: { $eq: ["$owner._id", userObjectId] },
                    then: {
                        $filter: {
                            input: "$vibesDown",
                            as: "r",
                            cond: { $not: { $in: ["$$r", hiddenUserObjectIds] } }
                        }
                    },
                    else: []
                }
            }
        }
    };

    const aggregationPipeline = [
        { $match: initialMatch },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        privacyMatch,
        {
            $facet: {
                posts: [
                    { $match: { type: "post" } },
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    projectStage
                ],
                reels: [
                    { $match: { type: "reel" } },
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    projectStage
                ],
                totalPosts: [
                    { $match: { type: "post" } },
                    { $count: "count" }
                ],
                totalReels: [
                    { $match: { type: "reel" } },
                    { $count: "count" }
                ]
            }
        }
    ];

    const [result] = await Post.aggregate(aggregationPipeline);

    const totalPosts = result.totalPosts[0]?.count || 0;
    const totalReels = result.totalReels[0]?.count || 0;

    res.json({
        posts: result.posts,
        reels: result.reels,
        pagination: {
            page,
            limit,
            totalPosts,
            totalReels,
            hasMorePosts: skip + result.posts.length < totalPosts,
            hasMoreReels: skip + result.reels.length < totalReels
        }
    });
});

export const handleFeedback = TryCatch(async (req, res) => {
    const { feedbackType } = req.body; // "vibeUp" or "vibeDown"

    if (!["vibeUp", "vibeDown"].includes(feedbackType)) {
        return res.status(400).json({ message: "Invalid feedback type. Use 'vibeUp' or 'vibeDown'" });
    }

    const userId = req.user._id;
    const postId = req.params.id;

    // Mutually exclusive fields
    const currentField = feedbackType === "vibeUp" ? "vibesUp" : "vibesDown";
    const otherField = feedbackType === "vibeUp" ? "vibesDown" : "vibesUp";

    // 1. Check if feedback already exists in CURRENT field
    const existingPost = await Post.findById(postId);
    if (!existingPost) return res.status(404).json({ message: "No Post with this id" });

    // Handle migration case where fields might be missing if not yet migrated
    const currentList = existingPost[currentField] || [];
    const isRemoving = currentList.includes(userId);

    let updatedPost;

    if (isRemoving) {
        // REMOVE
        updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $pull: { [currentField]: userId } },
            { new: true }
        );
    } else {
        // ADD (And ensure removed from the other field)
        updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $addToSet: { [currentField]: userId },
                $pull: { [otherField]: userId }
            },
            { new: true }
        );
    }

    const action = isRemoving ? "removed" : "added";

    // 🔥 REAL-TIME EMIT (PRIVACY SAFE)
    // Only emit VIBE UP update if it actually changed (Public)
    if (feedbackType === "vibeUp" || (feedbackType === "vibeDown" && action === "added" && existingPost.vibesUp?.includes(userId))) {
        io.to("post:" + updatedPost._id).emit("postVibeUpdated", {
            postId: updatedPost._id,
            vibesUp: updatedPost.vibesUp,
            vibesUpCount: updatedPost.vibesUp.length,
            action: feedbackType === "vibeUp" ? action : "removed",
        });
    }

    // Emit VIBE DOWN update ONLY to owner's private room
    io.to("user:" + updatedPost.owner.toString()).emit("postVibeDownUpdated", {
        postId: updatedPost._id,
        vibesDown: updatedPost.vibesDown,
        message: isRemoving ? `${feedbackType} removed` : `${feedbackType} added`,
    });

    // NOTIFICATION LOGIC (Asynchronous / Non-blocking)
    (async () => {
        try {
            if (isRemoving) {
                // Remove existing notification
                await Notification.deleteMany({
                    sender: userId,
                    receiver: updatedPost.owner,
                    postId: updatedPost._id,
                    type: feedbackType
                });
            } else if (updatedPost.owner.toString() !== userId.toString()) {
                const notification = await Notification.create({
                    receiver: updatedPost.owner,
                    sender: userId,
                    type: feedbackType,
                    postId: updatedPost._id,
                });

                await notification.populate("sender", "name profilePic");
                await notification.populate("postId", "post");
                io.to("user:" + updatedPost.owner.toString()).emit("notification:new", notification);

                if (feedbackType === "vibeUp") {
                    // updatedPost.owner is an ID (line 48 population is separate in other func, here strict findById update).
                    // We need to fetch owner name for Title if we don't have it.
                    // Actually, updatedPost.owner is ObjectId.
                    const ownerUser = await User.findById(updatedPost.owner).select("name");
                    const ownerName = ownerUser ? ownerUser.name : "Twikit";

                    await sendPushNotification(updatedPost.owner, {
                        title: `${ownerName} • Vibe Check`,
                        body: `${req.user.name} vibed up your post! ✨`,
                        url: `/post/${updatedPost._id.toString()}`,
                    });
                }
            }
        } catch (error) {
            console.error("Async feedback notification error:", error);
        }
    })();
});

// Simple in-memory cache for view deduplication (should be Redis for production)
const viewCache = new Set();

export const addPostView = TryCatch(async (req, res) => {
    const postId = req.params.id;
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const viewKey = `${postId}:${identifier}`;

    if (viewCache.has(viewKey)) {
        return res.json({ message: "View already counted" });
    }

    // Increment view count directly - accessible to guests too
    await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });

    // Track view (clearing cache periodically or using TTL would be better)
    viewCache.add(viewKey);
    setTimeout(() => viewCache.delete(viewKey), 10 * 60 * 1000); // 10 min cooldown

    res.json({
        message: "View added",
    });
});




export const editCaption = TryCatch(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post)
        return res.status(404).json({
            message: "No Post with this id",
        });

    if (post.owner.toString() !== req.user._id.toString())
        return res.status(403).json({
            message: "You are not owner of this post",
        });

    post.caption = req.body.caption;

    await post.save();

    res.json({
        message: "post updated",
    });
});


export const getRandomPosts = async (req, res) => {
    const posts = await Post.aggregate([
        { $sample: { size: 12 } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        { $unwind: "$owner" },
        {
            $match: {
                "owner.isPrivate": false
            }
        },
        {
            $project: {
                vibesDown: 0,
                "owner.password": 0,
            }
        }
    ]);

    res.json(posts);
};
// ... existing exports

export const saveUnsavePost = TryCatch(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            message: "No Post with this id",
        });
    }

    const user = await User.findById(req.user._id);

    if (user.savedPosts.includes(post._id)) {
        // Unsave
        const index = user.savedPosts.indexOf(post._id);
        user.savedPosts.splice(index, 1);
        await user.save();

        res.json({
            message: "Post Unsaved",
        });
    } else {
        // Save
        user.savedPosts.push(post._id);
        await user.save();

        res.json({
            message: "Post Saved",
        });
    }
});
// ... existing code ...

export const getPost = TryCatch(async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("owner", "name username profilePic isPrivate");

        if (!post) {
            return res.status(404).json({
                message: "No Post with this id",
            });
        }

        const isGuest = !req.user;

        // Privacy Check
        if (post.owner.isPrivate) {
            if (isGuest) {
                return res.status(401).json({ message: "Login required to view this private post" });
            }
            const isFollower = post.owner.followers.includes(req.user._id);
            const isOwner = post.owner._id.toString() === req.user._id.toString();
            if (!isFollower && !isOwner) {
                return res.status(403).json({ message: "You don't have access to this private post" });
            }
        }

        // VibesDown Privacy (Private to owner)
        const isOwner = !isGuest && post.owner._id.toString() === req.user._id.toString();
        if (!isOwner) {
            post.vibesDown = []; // Clean data before sending
        }

        // ... existing getPost ...
        res.json(post);
    } catch (error) {
        console.error("getPost Error:", error);
        if (error.name === "CastError") {
            return res.status(404).json({ message: "Invalid Post ID" });
        }
        throw error;
    }
});

export const getUserPosts = TryCatch(async (req, res) => {
    const userId = req.params.id;
    const isGuest = !req.user;

    // 1. Verify target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // 2. PRIVACY CHECK
    // If own profile -> Allow
    // If public -> Allow
    // If private -> Must be follower
    let isAllowed = false;

    if (!isGuest && req.user._id.toString() === userId.toString()) {
        isAllowed = true;
    } else if (!targetUser.isPrivate) {
        isAllowed = true;
        // Check if blocked
        if (!isGuest && (targetUser.blockedUsers.includes(req.user._id) || req.user.blockedUsers.includes(targetUser._id))) {
            return res.status(403).json({ message: "User is unavailable" });
        }
    } else {
        // Private profile
        if (isGuest) {
            return res.status(401).json({ message: "Login required to view private content" });
        }
        if (targetUser.followers.includes(req.user._id)) {
            isAllowed = true;
        }
    }

    if (!isAllowed) {
        return res.status(403).json({ message: "This account is private. Follow to see posts." });
    }

    // 3. Fetch Posts
    const posts = await Post.find({ owner: userId, type: "post" })
        .sort({ createdAt: -1 })
        .populate("owner", "name username profilePic isPrivate");

    const reels = await Post.find({ owner: userId, type: "reel" })
        .sort({ createdAt: -1 })
        .populate("owner", "name username profilePic isPrivate");

    res.json({ posts, reels });
});
