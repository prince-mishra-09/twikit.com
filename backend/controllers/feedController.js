import User from "../models/userModel.js";
import TryCatch from "../utils/tryCatch.js";

// Hide a post
export const hidePost = TryCatch(async (req, res) => {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.hiddenPosts.includes(postId)) {
        user.hiddenPosts.push(postId);
        await user.save();
    }

    res.json({ message: "Post hidden" });
});

// Unhide a post (Optional/Undo)
export const unhidePost = TryCatch(async (req, res) => {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);

    user.hiddenPosts = user.hiddenPosts.filter(
        (id) => id.toString() !== postId.toString()
    );
    await user.save();

    res.json({ message: "Post unhidden" });
});

// Mute a user
export const muteUser = TryCatch(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.mutedUsers.includes(userId)) {
        user.mutedUsers.push(userId);
        await user.save();
    }

    res.json({ message: "User muted" });
});

// Unmute a user
export const unmuteUser = TryCatch(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    user.mutedUsers = user.mutedUsers.filter(
        (id) => id.toString() !== userId.toString()
    );
    await user.save();

    res.json({ message: "User unmuted" });
});
