import { Post } from "../models/postModel.js";
import { Comment } from "../models/Comment.js";
import { Notification } from "../models/Notification.js";
import TryCatch from "../utils/tryCatch.js";
import { io } from "../socket/socket.js";
import { sendPushNotification } from "./notificationController.js";

export const createComment = TryCatch(async (req, res) => {
    const { postId } = req.params;
    const { comment, parentComment } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "No Post with this id" });

    if (parentComment) {
        const parent = await Comment.findById(parentComment);
        if (!parent) return res.status(404).json({ message: "Parent comment not found" });
        if (parent.post.toString() !== postId)
            return res.status(400).json({ message: "Parent comment belongs to a different post" });
        if (parent.parentComment)
            return res.status(400).json({ message: "Nested replies are not allowed" });
    }

    const newComment = await Comment.create({
        post: postId,
        user: req.user._id,
        comment,
        parentComment: parentComment || null,
    });

    // Update Post comments count
    post.commentsCount += 1;
    await post.save();

    await newComment.populate("user", "name profilePic");

    // Real-time Emit (Optional: You might want to emit to specific post room)
    // For now we can stick to simple update or let frontend fetch. 
    // If we want real-time, we should emit 'postCommentUpdated' behavior but now it's complex with separate doc.
    // Better to just notify user and let them refresh or append if they are active.

    // Notification Logic
    let receiverId;
    let type;

    if (parentComment) {
        const parent = await Comment.findById(parentComment);
        if (parent.user.toString() !== req.user._id.toString()) {
            receiverId = parent.user;
            type = "comment_reply";
        }
    } else {
        if (post.owner.toString() !== req.user._id.toString()) {
            receiverId = post.owner;
            type = "comment";
        }
    }

    if (receiverId) {
        const notification = await Notification.create({
            receiver: receiverId,
            sender: req.user._id,
            type,
            postId,
        });

        await notification.populate("sender", "name profilePic");
        await notification.populate("postId", "post");

        io.to(receiverId.toString()).emit("notification:new", notification);

        const bodyText = type === "comment_reply"
            ? `${req.user.name} replied to your comment`
            : `${req.user.name} commented on your post`;

        await sendPushNotification(receiverId, {
            title: "New Interaction",
            body: bodyText,
            url: `/post/${postId}?commentId=${newComment._id}`,
        });
    }

    res.status(201).json({
        message: "Comment Added",
        comment: newComment,
    });
});

export const getPostComments = TryCatch(async (req, res) => {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
        .populate("user", "name profilePic")
        .sort({ createdAt: -1 }); // Newest first

    // Grouping
    const topLevel = [];
    const repliesMap = {};

    comments.forEach(c => {
        if (!c.parentComment) {
            topLevel.push({ ...c.toObject(), replies: [] });
        } else {
            const parentId = c.parentComment.toString();
            if (!repliesMap[parentId]) repliesMap[parentId] = [];
            repliesMap[parentId].push(c);
        }
    });

    // Attach replies to topLevel
    // Sort replies oldest first (chronological)
    topLevel.forEach(c => {
        if (repliesMap[c._id.toString()]) {
            c.replies = repliesMap[c._id.toString()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
    });

    res.json({ comments: topLevel });
});

export const deleteComment = TryCatch(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const post = await Post.findById(comment.post);

    if (
        comment.user.toString() === req.user._id.toString() ||
        (post && post.owner.toString() === req.user._id.toString())
    ) {
        // If it's a parent comment, delete replies too or handle orphaned?
        // Usually delete replies.
        await Comment.deleteMany({ parentComment: comment._id });

        // Decrement count (1 + replies count)
        const repliesCount = await Comment.countDocuments({ parentComment: comment._id });

        await comment.deleteOne();

        if (post) {
            post.commentsCount = Math.max(0, post.commentsCount - 1 - repliesCount);
            await post.save();
        }

        res.json({ message: "Comment Deleted" });
    } else {
        res.status(403).json({ message: "Unauthorized" });
    }
});

export const migrateLegacyComments = TryCatch(async (req, res) => {
    // 1. Find all posts that still have the 'comments' array with items
    // Since we removed 'comments' from schema, Mongoose might not select it by default 
    // unless strict: false or we check raw docs.
    // Actually, if we removed it from schema, accessing post.comments might be undefined 
    // unless we treat it carefully or re-add it temporarily to schema OR use lean().

    // However, the user said they disappeared, meaning they are likely still in DB but not schema.
    // Let's assume we can fetch them via a raw query or if Mongoose strict is loose.
    // To be safe, let's use collection directly or update schema temporarily? 
    // Faster way: use .collection to access raw MongoDB driver.

    // BUT simplest way if Mongoose schema was just changed in Code:
    // Mongoose schema change doesn't delete data. 
    // We can just rely on `Post.collection.find({})` to get raw docs.

    const postsCursor = Post.collection.find({ "comments.0": { $exists: true } });
    let count = 0;

    while (await postsCursor.hasNext()) {
        const post = await postsCursor.next();
        const comments = post.comments || [];

        if (comments.length > 0) {
            console.log(`Migrating ${comments.length} comments for post ${post._id}`);

            for (const c of comments) {
                // Check if already migrated? (Maybe duplicate check via date/text/user?)
                // For simplicity, we assume if local comments exist, we migrate.
                // We will CLEAR local comments after migration to prevent dupes if run twice.

                if (!c.user || !c.comment) continue;

                await Comment.create({
                    post: post._id,
                    user: c.user,
                    comment: c.comment,
                    createdAt: c.createdAt || new Date(),
                    parentComment: null // All legacy comments are top-level
                });
            }

            // Update Post: Increment commentsCount and UNSET comments array
            await Post.collection.updateOne(
                { _id: post._id },
                {
                    $inc: { commentsCount: comments.length },
                    $unset: { comments: "" }
                }
            );

            count += comments.length;
        }
    }

    res.json({ message: `Migration complete. Migrated ${count} comments.` });
});
