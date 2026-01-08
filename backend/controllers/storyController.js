import { Story } from "../models/storyModel.js";
import User from "../models/userModel.js";
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";

export const createStory = async (req, res) => {
    try {
        const { text } = req.body;
        const file = req.file;

        let mediaUrl = "";

        if (file) {
            const fileUrl = getDataUrl(file);
            const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
                folder: "stories",
                resource_type: "auto",
            });
            mediaUrl = myCloud.secure_url;
        }

        if (!text && !mediaUrl) {
            return res.status(400).json({
                message: "Story must have either text or media",
            });
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        const story = await Story.create({
            user: req.user._id,
            text,
            mediaUrl,
            expiresAt,
        });

        res.status(201).json({
            message: "Story created successfully",
            story,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getStoryFeed = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Get stories from followings + self
        // Exclude expired stories
        // Exclude blocked users (if blocking logic exists, for now assuming followings is safe)

        const followingIds = user.followings;

        // Include self in stories? usually yes
        const targetIds = [...followingIds, req.user._id];

        const stories = await Story.find({
            user: { $in: targetIds },
            expiresAt: { $gt: new Date() }, // Only active stories
        })
            .populate("user", "name profilePic")
            .populate("viewers", "name profilePic") // Populate viewers
            .sort({ createdAt: 1 }); // Oldest first usually for stories

        // Group stories by user for UI
        // { userId: { user: {...}, stories: [...] } }
        const groupedStories = {};

        stories.forEach((story) => {
            const userId = story.user._id.toString();
            if (!groupedStories[userId]) {
                groupedStories[userId] = {
                    user: story.user,
                    stories: [],
                };
            }
            groupedStories[userId].stories.push(story);
        });

        // Convert to array
        const feed = Object.values(groupedStories);

        // Sort: PUT SELF FIRST, then others by latest update?
        // For "Quiet" feed, maybe just latest update time
        feed.sort((a, b) => {
            // If one is self, prioritize?
            if (a.user._id.toString() === req.user._id.toString()) return -1;
            if (b.user._id.toString() === req.user._id.toString()) return 1;

            // Otherwise sort by latest story time (newest activity first)
            const lastStoryA = a.stories[a.stories.length - 1].createdAt;
            const lastStoryB = b.stories[b.stories.length - 1].createdAt;
            return new Date(lastStoryB) - new Date(lastStoryA);
        });

        res.status(200).json(feed);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getStoriesByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Feature 3: Private Account Check
        if (user.isPrivate) {
            // Check if requesting user is following target user or IS the target user
            const isFollowing = user.followers.includes(req.user._id);
            const isSelf = user._id.toString() === req.user._id.toString();

            if (!isFollowing && !isSelf) {
                return res.status(403).json({ message: "Private Account" });
            }
        }

        // Logic: active stories only
        const stories = await Story.find({
            user: userId,
            expiresAt: { $gt: new Date() },
        })
            .populate("user", "name profilePic")
            .populate("viewers", "name profilePic")
            .sort({ createdAt: 1 });

        if (stories.length === 0) return res.json(null);

        // Return in same format as feed group
        const group = {
            user: {
                _id: user._id,
                name: user.name,
                profilePic: user.profilePic
            },
            stories: stories
        };

        res.status(200).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const viewStory = async (req, res) => {
    try {
        const storyId = req.params.id;
        const userId = req.user._id;

        // Check if user has already viewed
        const story = await Story.findById(storyId);

        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (story.user.toString() !== userId.toString() && !story.viewers.includes(userId)) {
            story.viewers.push(userId);
            await story.save();
        }

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const deleteStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (story.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await story.deleteOne();

        res.status(200).json({
            message: "Story deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
