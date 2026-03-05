import { Post } from "../models/postModel.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import TryCatch from "../utils/tryCatch.js";
import getDataUrl from "../utils/urlGenerator.js";
import { uploadFile, deleteFile } from '../utils/imagekit.js';
import { getIO } from "../socket/socketIO.js";
import { Notification } from "../models/Notification.js";
import { sendPushNotification } from "./notificationController.js";
import redis from "../utils/redis.js";
import { logToFile } from "../utils/logToFile.js";


// ==============================================================================
// 1. CREATE POST (Robust Background Handling)
// ==============================================================================
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

    // 1. Send Immediate Response
    res.status(202).json({
        message: "Post upload started",
        status: "processing",
    });

    const ownerIdStr = req.user._id.toString();

    // 2. Process in Background (Non-blocking)
    setImmediate(async () => {
        try {
            logToFile(`[BACKGROUND UPLOAD] Starting upload for user ${ownerIdStr}, type: ${type}`);
            const fileUrl = getDataUrl(file);
            const option = type === "reel" ? { resource_type: "video" } : {};

            // Heavy: ImageKit Upload
            const myCloud = await uploadFile(fileUrl.content, file.originalname, type === "reel" ? "reels" : "posts");
            logToFile(`[BACKGROUND UPLOAD] ImageKit upload success for user ${ownerIdStr}`);

            // Heavy: DB Creation
            const post = await Post.create({
                caption,
                post: {
                    id: myCloud.id,
                    url: myCloud.url,
                },
                owner: ownerId,
                type,
            });

            // Populate for frontend (match getAllPosts projection)
            await post.populate("owner", "name username profilePic isPrivate");

            // 3. Emit "Ready" Event to User
            try {
                getIO().to("user:" + ownerIdStr).emit("post:ready", post);
                logToFile(`[BACKGROUND UPLOAD] Socket emit 'post:ready' success for user ${ownerIdStr}`);
            } catch (socketErr) {
                logToFile(`[BACKGROUND UPLOAD] Socket emit failed: ${socketErr.message}`);
            }

        } catch (error) {
            console.error("Background Upload Error:", error);
            logToFile(`[BACKGROUND UPLOAD] Failure: ${error.message}`);

            // Emit "Failed" Event
            try {
                getIO().to("user:" + ownerIdStr).emit("post:failed", {
                    message: "Post upload failed",
                    error: error.message || "Unknown error"
                });
            } catch (socketErr) {
                logToFile(`[BACKGROUND UPLOAD] Error socket emit failed: ${socketErr.message}`);
            }
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

    await deleteFile(post.post.id);

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

        // CACHE THIS IN REDIS LATER
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

    // 3. Projection Stage (Optimization & Sanitization) - Reused
    const projectStage = {
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
        vibesUp: 1,
        vibesDown: {
            $cond: {
                if: { $eq: ["$owner._id", userObjectId] },
                then: "$vibesDown",
                else: []
            }
        }
    };

    // OPTIMIZED: Run two parallel queries instead of $facet
    // This allows MongoDB to use the { type: 1, createdAt: -1 } index efficiently

    const commonPipeline = [
        { $match: initialMatch },
        // Lookup User FIRST to filter by privacy before sorting (unless index covers it)
        // Actually, we need to sort first for pagination, BUT privacy check needs owner data.
        // Best approach:
        // 1. Match public/private visible posts
        // 2. Sort & limit
        // 3. Lookup user details

        // HOWEVER, we need to know if owner is private to filter.
        // Improved Strategy:
        // 1. $lookup owner
        // 2. $match privacy
        // 3. $sort (This is still heavy but better than facet)

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $match: {
                $or: [
                    { "owner.isPrivate": false }, // Public Account
                    ...(userObjectId ? [
                        { "owner._id": userObjectId }, // My own posts
                        { "owner.followers": userObjectId } // I am a follower
                    ] : [])
                ]
            }
        }
    ];

    // Unified Fetch (Posts + Reels)
    const postsPromise = Post.aggregate([
        { $match: { type: { $in: ["post", "reel"] }, ...initialMatch } },
        ...commonPipeline,
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: projectStage }
    ]);

    // Count (Optional: remove if not needed for infinite scroll, or cache it)
    // For now, keep it but maybe optimize?
    // Doing a full count with the complex privacy pipeline is VERY slow.
    // We will estimate or skip count if possible, but frontend uses it.
    // Warning: exact count on filtered set is expensive.

    // Simplification: Count distinct docs matching initialMatch + type. 
    // This ignores privacy filter for count but is much faster.
    // Or we just accept the cost for now. Use $count stage.

    // Unified Count (Accurate with Privacy Filters)
    const countPipeline = [
        { $match: { type: { $in: ["post", "reel"] }, ...initialMatch } },
        ...commonPipeline,
        { $count: "total" }
    ];

    const countPromise = Post.aggregate(countPipeline);

    const [posts, countResult] = await Promise.all([
        postsPromise,
        countPromise
    ]);

    const totalPosts = countResult.length > 0 ? countResult[0].total : 0;

    res.json({
        posts,
        reels: [], // Legacy empty array
        pagination: {
            page,
            limit,
            totalPosts,
            totalReels: totalPosts, // Legacy keep
            hasMorePosts: posts.length === limit,
        }
    });
});

export const handleFeedback = TryCatch(async (req, res) => {
    const { feedbackType } = req.body; // "vibeUp" or "vibeDown"
    const userId = req.user._id;
    const postId = req.params.id;

    logToFile(`[START] Feedback: ${feedbackType}, Post: ${postId}, User: ${userId}`);

    // 1. Validate Post ID
    if (!mongoose.Types.ObjectId.isValid(postId)) {
        logToFile(`Invalid Post ID: ${postId}`);
        return res.status(400).json({ message: "Invalid Post ID" });
    }

    if (!["vibeUp", "vibeDown"].includes(feedbackType)) {
        return res.status(400).json({ message: "Invalid feedback type. Use 'vibeUp' or 'vibeDown'" });
    }

    // Mutually exclusive fields
    const currentField = feedbackType === "vibeUp" ? "vibesUp" : "vibesDown";
    const otherField = feedbackType === "vibeUp" ? "vibesDown" : "vibesUp";

    // 2. Fetch Post
    const existingPost = await Post.findById(postId);
    if (!existingPost) {
        logToFile(`Post not found: ${postId}`);
        return res.status(404).json({ message: "No Post with this id" });
    }

    const currentList = existingPost[currentField] || [];
    let isRemoving = false;
    try {
        isRemoving = Array.isArray(currentList) && currentList.some(id => id && id.toString() === userId.toString());
    } catch (err) {
        logToFile(`Error in isRemoving check: ${err.message}`);
    }
    logToFile(`isRemoving: ${isRemoving}`);

    let updatedPost;
    try {
        if (isRemoving) {
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $pull: { [currentField]: userId } },
                { new: true }
            );
        } else {
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                {
                    $addToSet: { [currentField]: userId },
                    $pull: { [otherField]: userId }
                },
                { new: true }
            );
        }

        if (!updatedPost) {
            logToFile("Update failed: Post was likely deleted during operation");
            return res.status(404).json({ message: "Post no longer exists" });
        }
        logToFile(`DB Update Success: ${updatedPost._id}`);
    } catch (dbError) {
        logToFile(`DB Update Error: ${dbError.message}`);
        throw dbError; // Caught by tryCatch middleware
    }

    const action = isRemoving ? "removed" : "added";

    // Populate owner before sending to client to prevent "Deleted User" bug
    await updatedPost.populate("owner", "name username profilePic isPrivate");

    // 🔥 REAL-TIME EMIT (SAFE)
    try {
        const io = getIO();

        // Public update (Vibe Up changes)
        // We emit if vibeUp was added/removed, OR if vibeDown was added while vibeUp was present (removal of vibeUp)
        const wasVibedUp = existingPost.vibesUp && existingPost.vibesUp.some(id => id && id.toString() === userId.toString());

        if (feedbackType === "vibeUp" || (feedbackType === "vibeDown" && action === "added" && wasVibedUp)) {
            io.to("post:" + updatedPost._id.toString()).emit("postVibeUpdated", {
                postId: updatedPost._id,
                vibesUp: updatedPost.vibesUp,
                vibesUpCount: updatedPost.vibesUp.length,
                vibesDownCount: updatedPost.vibesDown.length,  // here i am sagar added this line to get count of down 
                action: feedbackType === "vibeUp" ? action : "removed",
            });
        }

        // Private update (Vibe Down info for owner)
        io.to("user:" + updatedPost.owner._id.toString()).emit("postVibeDownUpdated", {
            postId: updatedPost._id,
            vibesDown: updatedPost.vibesDown,
            message: `${feedbackType} ${action}`,
        });
        logToFile("Emits successful");
    } catch (emitError) {
        logToFile(`Emit warning: ${emitError.message}`);
        // We don't throw here to ensure user gets a response even if socket fails
    }

    // 3. Send Response IMMEDIATELY
    res.json({
        message: `${feedbackType} ${action}`,
        action,
        post: updatedPost, // Return the full post object as 'post'
        vibesUpCount: updatedPost.vibesUp.length,
        vibesDownCount: updatedPost.vibesDown.length,
        isVibedUp: updatedPost.vibesUp.some(id => id && id.toString() === userId.toString()),
        isVibedDown: updatedPost.vibesDown.some(id => id && id.toString() === userId.toString())
    });

    // 4. Background Notification Logic
    (async () => {
        try {
            if (isRemoving) {
                await Notification.deleteMany({
                    sender: userId,
                    receiver: updatedPost.owner,
                    postId: updatedPost._id,
                    type: feedbackType
                });
            } else if (updatedPost.owner._id.toString() !== userId.toString()) {
                const notification = await Notification.create({
                    receiver: updatedPost.owner,
                    sender: userId,
                    type: feedbackType,
                    postId: updatedPost._id,
                });

                await notification.populate("sender", "name profilePic");
                await notification.populate("postId", "post");

                try {
                    getIO().to("user:" + updatedPost.owner._id.toString()).emit("notification:new", notification);
                } catch (e) { }

                if (feedbackType === "vibeUp") {
                    const ownerUser = await User.findById(updatedPost.owner._id).select("name");
                    const ownerName = ownerUser ? ownerUser.name : "Twikit";

                    await sendPushNotification(updatedPost.owner._id, {
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


export const addPostView = TryCatch(async (req, res) => {
    const postId = req.params.id;
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const viewKey = `post_view:${postId}:${identifier}`;

    // Redis: Check if already viewed (fast distributed check)
    // using set(key, val, 'EX', ttl, 'NX') -> returns 'OK' if set, null if already exists
    // Upstash/IORedis compatible
    const isNewView = await redis.set(viewKey, "1", "EX", 600, "NX");

    if (!isNewView) {
        return res.json({ message: "View already counted" });
    }

    // Increment view count directly
    await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });

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

    // 3. Fetch Posts (Optimized: Parallel + Limit)
    const postsPromise = Post.find({ owner: userId, type: "post" })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("owner", "name username profilePic isPrivate")
        .lean();

    const reelsPromise = Post.find({ owner: userId, type: "reel" })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("owner", "name username profilePic isPrivate")
        .lean();

    const [posts, reels] = await Promise.all([postsPromise, reelsPromise]);

    res.json({ posts, reels });
});
