import { Post } from "../models/postModel.js";
import User from "../models/userModel.js";
import TryCatch from "../utils/tryCatch.js";
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";
import { io } from "../socket/socket.js";
import { Notification } from "../models/Notification.js";
import { sendPushNotification } from "./notificationController.js";

export const newPost = TryCatch(async (req, res) => {
    //     console.log("req.file:", req.file);
    // console.log("req.body:", req.body);

    const { caption } = req.body;
    // console.log("main caption");

    const ownerId = req.user._id;

    const file = req.file;
    const fileUrl = getDataUrl(file);

    let option;

    const type = req.query.type;
    if (type === "reel") {
        option = {
            resource_type: "video",
        };
    } else {
        option = {};
    }

    const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, option);

    const post = await Post.create({
        caption,
        post: {
            id: myCloud.public_id,
            url: myCloud.secure_url,
        },
        owner: ownerId,
        type,
    });

    res.status(201).json({
        message: "Post created",
        post,
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
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Default 20 posts per page
    const skip = (page - 1) * limit;

    const isGuest = !req.user;
    let user = null;
    let blockedByUsers = [];
    let hiddenUserIds = [];

    if (!isGuest) {
        user = await User.findById(req.user._id);
        // 0. Fetch users who have BLOCKED the current user ('blockedBy')
        blockedByUsers = await User.find({ blockedUsers: req.user._id }).distinct('_id');
        // 1. Combine with users I have BLOCKED
        const blockedUsers = user.blockedUsers || [];
        hiddenUserIds = [
            ...blockedUsers.map(id => id.toString()),
            ...blockedByUsers.map(id => id.toString())
        ];
    }

    const baseQuery = (type) => {
        const query = { type };
        if (!isGuest) {
            query._id = { $nin: user.hiddenPosts };
            query.owner = { $nin: [...user.mutedUsers, ...hiddenUserIds] };
        } else {
            // For guests, we only want posts from non-private owners
            // We'll handle this in the aggregation or manual filter later if needed,
            // but for simple find, we can't easily join here without aggregate.
            // Let's use populate then filter, or better: aggregate.
        }
        return query;
    };

    let posts = await Post.find(baseQuery("post"))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "-password");

    let reels = await Post.find(baseQuery("reel"))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "-password");

    const filterPublicOnly = (items) => {
        return items.filter(item => {
            if (!item.owner) return false;
            // If logged in, check privacy rules
            if (!isGuest) {
                if (item.owner._id.toString() === req.user._id.toString()) return true;
                if (!item.owner.isPrivate) return true;
                if (item.owner.followers.includes(req.user._id)) return true;
                return false;
            }
            // If guest, only public accounts
            return !item.owner.isPrivate;
        });
    };

    // Sanitize engagement (remove reals/reflections from blocked users AND blockedBy users)
    const sanitizeEngagement = (items) => {
        return items.map(item => {
            const isOwner = !isGuest && item.owner._id.toString() === req.user._id.toString();

            // Filter Reals
            if (item.reals && item.reals.length > 0 && !isGuest) {
                item.reals = item.reals.filter(id => id && !hiddenUserIds.includes(id.toString()));
            }

            // Filter Reflections (Only owner sees these)
            if (isOwner) {
                if (item.reflections && item.reflections.length > 0) {
                    item.reflections = item.reflections.filter(id => id && !hiddenUserIds.includes(id.toString()));
                }
            } else {
                // If not owner OR guest, hide reflections
                item.reflections = [];
            }

            return item;
        });
    };

    const sanctionedPosts = filterPublicOnly(posts);
    const sanctionedReels = filterPublicOnly(reels);

    const sanitizedPosts = sanitizeEngagement(sanctionedPosts);
    const sanitizedReels = sanitizeEngagement(sanctionedReels);

    // Get total counts for pagination metadata
    const totalPostsCount = await Post.countDocuments(baseQuery("post"));
    const totalReelsCount = await Post.countDocuments(baseQuery("reel"));

    res.json({
        posts: sanitizedPosts,
        reels: sanitizedReels,
        pagination: {
            page,
            limit,
            totalPosts: totalPostsCount,
            totalReels: totalReelsCount,
            hasMorePosts: skip + posts.length < totalPostsCount,
            hasMoreReels: skip + reels.length < totalReelsCount
        }
    });
});

export const handleFeedback = TryCatch(async (req, res) => {
    const { feedbackType } = req.body; // "real" or "reflect"

    if (!["real", "reflect"].includes(feedbackType)) {
        return res.status(400).json({ message: "Invalid feedback type" });
    }

    const userId = req.user._id;
    const postId = req.params.id;

    // Mutually exclusive fields
    const currentField = feedbackType === "real" ? "reals" : "reflections";
    const otherField = feedbackType === "real" ? "reflections" : "reals";

    // 1. Check if feedback already exists in CURRENT field
    const existingPost = await Post.findById(postId);
    if (!existingPost) return res.status(404).json({ message: "No Post with this id" });

    const isRemoving = existingPost[currentField].includes(userId);

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
    // Only emit PUBLIC REAL update if it actually changed
    if (feedbackType === "real" || (feedbackType === "reflect" && action === "added" && existingPost.reals.includes(userId))) {
        io.emit("postRealUpdated", {
            postId: updatedPost._id,
            reals: updatedPost.reals,
            realsCount: updatedPost.reals.length,
            action: feedbackType === "real" ? action : "removed",
        });
    }

    // Emit REFLECTION update ONLY to owner's private room
    io.to(updatedPost.owner.toString()).emit("postReflectionUpdated", {
        postId: updatedPost._id,
        reflections: updatedPost.reflections,
        reflectionsCount: updatedPost.reflections.length,
        action: feedbackType === "reflect" ? action : (action === "added" ? "removed" : "none"),
        userId: userId,
    });

    // Send immediate response
    res.json({
        message: isRemoving ? `${feedbackType} feedback removed` : `${feedbackType} feedback added`,
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
                io.to(updatedPost.owner.toString()).emit("notification:new", notification);

                if (feedbackType === "real") {
                    await sendPushNotification(updatedPost.owner, {
                        title: "New Real Feedback",
                        body: `${req.user.name} thinks your post is Real`,
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
                reflections: 0,
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
        const post = await Post.findById(req.params.id).populate("owner", "-password");

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

        // Reflections Privacy
        const isOwner = !isGuest && post.owner._id.toString() === req.user._id.toString();
        if (!isOwner) {
            post.reflections = [];
        }

        res.json(post);
    } catch (error) {
        console.error("getPost Error:", error);
        if (error.name === "CastError") {
            return res.status(404).json({ message: "Invalid Post ID" });
        }
        throw error;
    }
});
