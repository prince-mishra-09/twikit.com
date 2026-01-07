import { Post } from "../models/postModel.js";
import User from "../models/userModel.js";
import TryCatch from "../utils/tryCatch.js";
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";
import { io } from "../socket/socket.js";
import { Notification } from "../models/Notification.js";

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

    await post.deleteOne();

    res.json({
        message: "Post Deleted",
    });
});

export const getAllPosts = TryCatch(async (req, res) => {
    // Determine the user's hidden and muted lists if logged in
    const user = await User.findById(req.user._id);

    const hiddenPosts = user.hiddenPosts;
    const mutedUsers = user.mutedUsers;

    // Filter query: Type is "post" AND ID is not in hiddenPosts AND Owner is not in mutedUsers
    const posts = await Post.find({
        type: "post",
        _id: { $nin: hiddenPosts },
        owner: { $nin: mutedUsers }
    })
        .sort({ createdAt: -1 })
        .populate("owner", "-password")
        .populate({
            path: "comments.user",
            select: "-password",
        });

    // Same logic for reels
    const reels = await Post.find({
        type: "reel",
        _id: { $nin: hiddenPosts },
        owner: { $nin: mutedUsers }
    })
        .sort({ createdAt: -1 })
        .populate("owner", "-password")
        .populate({
            path: "comments.user",
            select: "-password",
        });

    const filterPosts = (items) => {
        return items.filter(item => {
            if (item.owner._id.toString() === req.user._id.toString()) return true;
            if (!item.owner.isPrivate) return true;
            if (item.owner.followers.includes(req.user._id)) return true;
            return false;
        });
    };

    res.json({
        posts: filterPosts(posts),
        reels: filterPosts(reels)
    });
});

export const likeUnlikePost = TryCatch(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            message: "No Post with this id",
        });
    }

    let action = "";

    if (post.likes.includes(req.user._id)) {
        // UNLIKE
        post.likes = post.likes.filter(
            (id) => id.toString() !== req.user._id.toString()
        );
        action = "unlike";
    } else {
        // LIKE
        post.likes.push(req.user._id);
        action = "like";
    }

    await post.save();

    // 🔥 REAL-TIME EMIT
    io.emit("postLikeUpdated", {
        postId: post._id,
        likes: post.likes,
        likesCount: post.likes.length,
        action,
        userId: req.user._id,
    });

    // NOTIFICATION LOGIC
    if (action === "like" && post.owner.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            receiver: post.owner,
            sender: req.user._id,
            type: "like",
            postId: post._id,
        });

        // Real-time Emit
        await notification.populate("sender", "name profilePic");
        await notification.populate("postId", "post");
        io.to(post.owner.toString()).emit("notification:new", notification);
    }

    res.json({
        message: action === "like" ? "Post liked" : "Post unliked",
    });
});


export const commentonPost = TryCatch(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post)
        return res.status(404).json({
            message: "No Post with this id",
        });

    post.comments.push({
        user: req.user._id,
        name: req.user.name,
        comment: req.body.comment,
    });

    await post.save();

    // Populate user details for real-time update
    await post.populate({
        path: "comments.user",
        select: "name profilePic",
    });

    // Real-time emit
    io.emit("postCommentUpdated", {
        postId: post._id,
        comments: post.comments,
    });

    // NOTIFICATION LOGIC
    if (post.owner.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            receiver: post.owner,
            sender: req.user._id,
            type: "comment",
            postId: post._id,
        });

        await notification.populate("sender", "name profilePic");
        await notification.populate("postId", "post");
        io.to(post.owner.toString()).emit("notification:new", notification);
    }

    res.json({
        message: "Comment Added",
    });
});

export const deleteComment = TryCatch(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post)
        return res.status(404).json({
            message: "No Post with this id",
        });
    // console.log(req.query.commentId);

    if (!req.query.commentId)
        return res.status(404).json({
            // console.log();

            message: "Please give comment id",
        });

    const commentIndex = post.comments.findIndex(
        (item) => item._id.toString() === req.query.commentId.toString()
    );

    if (commentIndex === -1) {
        return res.status(400).json({
            message: "Comment not found",
        });
    }

    const comment = post.comments[commentIndex];

    if (
        post.owner.toString() === req.user._id.toString() ||
        comment.user.toString() === req.user._id.toString()
    ) {
        post.comments.splice(commentIndex, 1);

        await post.save();

        return res.json({
            message: "Comment deleted",
        });
    } else {
        return res.status(400).json({
            message: "Yor are not allowed to delete this comment",
        });
    }
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
