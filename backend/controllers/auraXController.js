import { AuraX } from "../models/AuraX.js";
import User from "../models/userModel.js";
import getDataUrl from "../utils/urlGenerator.js";
import { uploadFile, deleteFile } from '../utils/imagekit.js';
import { getAuraIdentity } from "../utils/auraIdentity.js";
import {
    checkAuraRateLimit,
    incrementAuraRateLimit,
    recordAuraView,
    checkAuraVibe,
    recordAuraVibe,
    removeAuraVibe,
} from "../utils/auraRateLimiter.js";

/**
 * Create new Aura X post
 * POST /api/aurax/new
 */
export const createAuraX = async (req, res) => {
    try {
        const { caption, usePreviousIdentity } = req.body;
        const userId = req.user._id;

        // 1. Check rate limit (max 24 posts per 24h)
        const rateLimit = await checkAuraRateLimit(userId);
        if (!rateLimit.allowed) {
            const hoursLeft = Math.ceil(rateLimit.resetIn / 3600);
            return res.status(429).json({
                message: `Aura X limit reached. You can post again in ${hoursLeft} hours.`,
                resetIn: rateLimit.resetIn,
            });
        }

        // 2. Validate caption
        if (!caption || caption.trim().length === 0) {
            return res.status(400).json({ message: "Caption is required" });
        }

        if (caption.length > 500) {
            return res.status(400).json({ message: "Caption too long (max 500 characters)" });
        }

        // 3. Media is now optional (text-only posts allowed)
        let mediaData = null;
        let postType = 'text';

        if (req.file) {
            // 4. Upload media to ImageKit if file exists
            const fileUri = getDataUrl(req.file);
            const isVideo = req.file.mimetype.startsWith("video");

            const myCloud = await uploadFile(
                fileUri.content,
                req.file.originalname,
                "aurax"
            );

            mediaData = {
                id: myCloud.id,
                url: myCloud.url,
            };
            postType = isVideo ? "video" : "image";
        }

        // 5. Get user for identity persistence
        const user = await User.findById(userId);

        // 6. Generate or reuse Aura identity
        const usePrevious = usePreviousIdentity === "true" || usePreviousIdentity === true;
        const identity = getAuraIdentity(user, usePrevious);

        // 7. Create Aura X post (media is optional)
        const auraX = await AuraX.create({
            authorId: userId,
            auraName: identity.auraName,
            auraColor: identity.auraColor,
            auraAvatar: user.auraAvatar || '👻',
            auraAvatarType: user.auraAvatarType || 'emoji',
            caption: caption.trim(),
            media: mediaData, // Can be null for text-only posts
            type: postType,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        // 7.5. Create Dual-Write Entry in DeadAuraX (Initial Snapshot)
        await import("../models/DeadAuraX.js").then(async ({ DeadAuraX }) => {
            await DeadAuraX.create({
                authorId: userId,
                auraName: identity.auraName,
                auraColor: identity.auraColor,
                auraAvatar: user.auraAvatar || '👻',
                auraAvatarType: user.auraAvatarType || 'emoji',
                caption: caption.trim(),
                media: mediaData || null,
                type: postType,
                vibesUpCount: 0,
                vibesKilledCount: 0,
                views: 0,
                originalCreatedAt: auraX.createdAt,
                originalExpiresAt: auraX.expiresAt,
                archivalReason: "created", // Initial state
                originalAuraId: auraX._id
            });
        });

        // 8. Update user's last identity (if new identity was generated)
        if (!usePrevious || !user.lastAuraIdentity) {
            user.lastAuraIdentity = {
                auraName: identity.auraName,
                auraColor: identity.auraColor,
            };
            await user.save();
        }

        // 9. Increment rate limit counter
        await incrementAuraRateLimit(userId);

        // 10. Return response (WITHOUT authorId)
        const response = auraX.toObject();
        delete response.authorId; // Extra safety

        res.status(201).json({
            message: "Aura created successfully",
            auraX: response,
            remaining: rateLimit.remaining - 1,
        });
    } catch (error) {
        console.error("Create Aura X error:", error);
        res.status(500).json({ message: "Server error creating Aura" });
    }
};

/**
 * Get all Aura X posts (Feed)
 * GET /api/aurax/all
 */
export const getAllAuraX = async (req, res) => {
    try {
        const { limit = 50, page = 1, skip = 0 } = req.query;

        // Calculate skip if page is provided
        const limitNum = parseInt(limit);
        const skipNum = parseInt(skip) || (parseInt(page) - 1) * limitNum;
        const userId = req.user ? req.user._id : null;

        // Build shadow-ban exclusion list
        const shadowBannedIds = await User.find({ isShadowBanned: true }).distinct("_id");

        // Aggregation pipeline for sorting and user status
        let pipeline = [
            // 0. Filter active-only posts and exclude shadow-banned authors
            {
                $match: {
                    status: "active",
                    ...(shadowBannedIds.length > 0 ? { authorId: { $nin: shadowBannedIds } } : {}),
                }
            },
            // 1. Calculate net score
            {
                $addFields: {
                    vibesUpCount: { $size: { $ifNull: ["$vibesUp", []] } },
                    vibesKilledCount: { $size: { $ifNull: ["$vibesKilled", []] } },
                }
            },
            {
                $addFields: {
                    netScore: { $subtract: ["$vibesUpCount", "$vibesKilledCount"] }
                }
            },
            // 2. Sort by Net Score (Descending), then Time (Newest)
            { $sort: { netScore: -1, createdAt: -1 } }
        ];

        // 3. Add user-specific fields if authenticated
        if (userId) {
            pipeline.push({
                $addFields: {
                    userVibedUp: { $in: [userId, { $ifNull: ["$vibesUp", []] }] },
                    userVibeKilled: { $in: [userId, { $ifNull: ["$vibesKilled", []] }] }
                }
            });
        }

        // 4. Remove sensitive data and projection
        // 4. Remove sensitive data and projection
        pipeline.push({
            $project: {
                authorId: 0
            }
        });

        // 5. Pagination
        pipeline.push({ $skip: skipNum });
        pipeline.push({ $limit: limitNum });

        const auras = await AuraX.aggregate(pipeline);
        const totalCount = await AuraX.countDocuments();

        res.json({
            auras,
            total: totalCount,
            hasMore: skipNum + auras.length < totalCount,
        });
    } catch (error) {
        console.error("Get all Aura X error:", error);
        res.status(500).json({ message: "Server error fetching Auras" });
    }
};

/**
 * Handle Vibe Up / Vibe Kill
 * POST /api/aurax/vibe/:id
 */
export const handleAuraVibe = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'vibeUp' or 'vibeKill'
        const userId = req.user._id;

        if (!['vibeUp', 'vibeKill'].includes(type)) {
            return res.status(400).json({ message: "Invalid vibe type" });
        }

        // 1. Find Aura (with authorId for notification purposes)
        const aura = await AuraX.findById(id).select("+authorId");
        if (!aura) {
            return res.status(404).json({ message: "Aura not found" });
        }

        // Ensure vibe arrays exist (for old posts that might not have them)
        if (!aura.vibesUp) aura.vibesUp = [];
        if (!aura.vibesKilled) aura.vibesKilled = [];

        // 2. Check if user already vibed
        const dbField = type === 'vibeUp' ? 'vibesUp' : 'vibesKilled';
        const oppositeDbField = type === 'vibeUp' ? 'vibesKilled' : 'vibesUp';

        const hasVibed = aura[dbField].includes(userId);
        const hasOppositeVibe = aura[oppositeDbField].includes(userId);

        // 3. Toggle vibe
        if (hasVibed) {
            // Remove vibe
            aura[dbField] = aura[dbField].filter((id) => id.toString() !== userId.toString());
            await removeAuraVibe(id, userId, type);
        } else {
            // Add vibe
            aura[dbField].push(userId);
            await recordAuraVibe(id, userId, type);

            // Remove opposite vibe if exists
            if (hasOppositeVibe) {
                aura[oppositeDbField] = aura[oppositeDbField].filter(
                    (id) => id.toString() !== userId.toString()
                );
                // Note: removeAuraVibe expects the original type ('vibeUp' or 'vibeKill')
                // opposite of 'vibeUp' is 'vibeKill'
                const oppositeType = type === 'vibeUp' ? 'vibeKill' : 'vibeUp';
                await removeAuraVibe(id, userId, oppositeType);
            }
        }

        await aura.save();

        // 4. Check if Aura should be "burned" (50+ Vibe Kills)
        const VIBE_KILL_THRESHOLD = 50;
        if (aura.vibesKilled.length >= VIBE_KILL_THRESHOLD) {
            // Delete the Aura (burn effect on frontend)
            // Only delete from ImageKit if media exists (text-only posts don't have media)
            if (aura.media && aura.media.id) {
                await deleteFile(aura.media.id);
            }
            await AuraX.findByIdAndDelete(id);

            return res.json({
                message: "Aura burned",
                burned: true,
                vibesUp: aura.vibesUp.length,
                vibesKilled: aura.vibesKilled.length,
            });
        }

        // 5. Return updated counts (without authorId)
        res.json({
            message: "Vibe updated",
            vibesUp: aura.vibesUp.length,
            vibesKilled: aura.vibesKilled.length,
            userVibedUp: aura.vibesUp.includes(userId),
            userVibeKilled: aura.vibesKilled.includes(userId),
            burned: false,
        });
    } catch (error) {
        console.error("Handle Aura vibe error:", error);
        res.status(500).json({ message: "Server error handling vibe" });
    }
};

/**
 * Add view to Aura X post
 * POST /api/aurax/view/:id
 */
export const addAuraView = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id || `guest_${req.ip}`;

        // 1. Check Redis deduplication
        const isNewView = await recordAuraView(id, userId.toString());

        // 2. Increment view count if new
        if (isNewView) {
            await AuraX.findByIdAndUpdate(id, { $inc: { views: 1 } });
        }

        res.json({ message: "View recorded", counted: isNewView });
    } catch (error) {
        console.error("Add Aura view error:", error);
        res.status(500).json({ message: "Server error recording view" });
    }
};

/**
 * Get user's own Aura X posts
 * GET /api/aurax/mine
 */
export const getUserAuras = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch user's own Auras (include authorId for verification)
        const auras = await AuraX.find({ authorId: userId })
            .sort({ createdAt: -1 })
            .select("-authorId") // Remove before sending
            .lean();

        res.json({ auras, count: auras.length });
    } catch (error) {
        console.error("Get user Auras error:", error);
        res.status(500).json({ message: "Server error fetching your Auras" });
    }
};

/**
 * Delete Aura X post (own posts only)
 * DELETE /api/aurax/:id
 */
export const deleteAuraX = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find with authorId
        const aura = await AuraX.findById(id).select("+authorId");
        if (!aura) {
            return res.status(404).json({ message: "Aura not found" });
        }

        // Verify ownership
        if (aura.authorId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this Aura" });
        }

        // Delete from ImageKit
        await deleteFile(aura.media.id);

        // Delete from database
        await AuraX.findByIdAndDelete(id);

        res.json({ message: "Aura deleted successfully" });
    } catch (error) {
        console.error("Delete Aura X error:", error);
        res.status(500).json({ message: "Server error deleting Aura" });
    }
};

/**
 * Get User Aura X Stats (Active + Archived)
 * GET /api/aurax/stats
 */
export const getUserAuraStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get stats from active Auras
        const activeStats = await AuraX.aggregate([
            { $match: { authorId: userId } },
            {
                $group: {
                    _id: null,
                    postsCount: { $sum: 1 },
                    vibesUp: { $sum: { $size: { $ifNull: ["$vibesUp", []] } } },
                    vibesKilled: { $sum: { $size: { $ifNull: ["$vibesKilled", []] } } },
                    views: { $sum: "$views" }
                }
            }
        ]);

        // 2. Get stats from dead Auras
        const { DeadAuraX } = await import("../models/DeadAuraX.js");
        const archivedStats = await DeadAuraX.aggregate([
            { $match: { authorId: userId } },
            {
                $group: {
                    _id: null,
                    postsCount: { $sum: 1 },
                    vibesUp: { $sum: "$vibesUpCount" },
                    vibesKilled: { $sum: "$vibesKilledCount" },
                    views: { $sum: "$views" }
                }
            }
        ]);

        const active = activeStats[0] || { postsCount: 0, vibesUp: 0, vibesKilled: 0, views: 0 };
        const archived = archivedStats[0] || { postsCount: 0, vibesUp: 0, vibesKilled: 0, views: 0 };

        res.json({
            postsCount: active.postsCount + archived.postsCount,
            vibesUp: active.vibesUp + archived.vibesUp,
            vibesKilled: active.vibesKilled + archived.vibesKilled,
            totalReach: active.views + archived.views,
        });
    } catch (error) {
        console.error("Get User Aura stats error:", error);
        res.status(500).json({ message: "Server error fetching stats" });
    }
};

/**
 * Get Top AuraX Personalities (Ranking)
 * GET /api/aurax/personalities
 */
export const getTopAuraPersonalities = async (req, res) => {
    try {
        // We calculate rank based on net score (vibesUp - vibesKilled) across all posts
        // Note: For simplicity and performance, we'll rank by vibesUp in active posts + archived

        // This is a complex query. For now, let's just return a few prominent users
        // to populate the UI, or implement a basic ranking.

        const { DeadAuraX } = await import("../models/DeadAuraX.js");

        const topPersonalities = await DeadAuraX.aggregate([
            {
                $group: {
                    _id: "$authorId",
                    totalVibesUp: { $sum: "$vibesUpCount" },
                    auraName: { $first: "$auraName" },
                    auraAvatar: { $first: "$auraAvatar" },
                }
            },
            { $sort: { totalVibesUp: -1 } },
            { $limit: 5 }
        ]);

        res.json({ personalities: topPersonalities });
    } catch (error) {
        console.error("Get top personalities error:", error);
        res.status(500).json({ message: "Server error fetching ranking" });
    }
};

/**
 * Get Trending Auras (Hashtags)
 * GET /api/aurax/trending
 */
export const getTrendingAuras = async (req, res) => {
    try {
        // Extract hashtags from recent AuraX posts
        const recentAuras = await AuraX.find().sort({ createdAt: -1 }).limit(100).select('caption');

        const hashtags = {};
        recentAuras.forEach(aura => {
            const matches = aura.caption.match(/#[a-zA-Z0-9_]+/g);
            if (matches) {
                matches.forEach(tag => {
                    hashtags[tag] = (hashtags[tag] || 0) + 1;
                });
            }
        });

        const sortedTags = Object.entries(hashtags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);

        res.json({ trending: sortedTags });
    } catch (error) {
        console.error("Get trending auras error:", error);
        res.status(500).json({ message: "Server error fetching trending" });
    }
};

/**
 * Get user's Aura identity (for display before creating post)
 * GET /api/aurax/identity
 */
export const getUserAuraIdentity = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user document
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check rate limit
        const rateLimit = await checkAuraRateLimit(userId);

        // Get identity (preview of what would be used if usePreviousIdentity is true)
        const identity = getAuraIdentity(user, true);

        // Check if this identity is from previous or is a generated one
        const isFromPrevious = !!(user.lastAuraIdentity?.auraName && user.lastAuraIdentity?.auraColor);

        res.json({
            identity: {
                auraName: identity.auraName,
                auraColor: identity.auraColor,
                auraAvatar: user.auraAvatar || '👻',
                auraAvatarType: user.auraAvatarType || 'emoji',
                isFromPrevious,
            },
            canPost: rateLimit.allowed,
            remaining: rateLimit.remaining,
        });
    } catch (error) {
        console.error("Get user Aura identity error:", error);
        res.status(500).json({ message: "Server error fetching identity" });
    }
};

// Save user's aura avatar (onboarding)
export const saveAuraAvatar = async (req, res) => {
    try {
        const userId = req.user._id;
        const { avatar, avatarType, auraName, auraColor, reusePrevious } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 1. Check if user is trying to reuse previous identity
        if (reusePrevious) {
            if (!user.lastAuraIdentity?.auraName) {
                return res.status(400).json({ message: "No previous identity found to reuse" });
            }
            // If reusing, we just return success without resetting the cooldown
            return res.json({
                success: true,
                message: "Identity reused successfully",
                avatar: user.auraAvatar,
                avatarType: user.auraAvatarType,
                auraName: user.lastAuraIdentity.auraName
            });
        }

        // 2. Cooldown Logic: Check if 24 hours have passed since last change
        const lastChange = user.lastAuraIdentityChange;
        const now = new Date();
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours

        if (lastChange && (now - lastChange < cooldownMs)) {
            const remainingMs = cooldownMs - (now - lastChange);
            const hours = Math.floor(remainingMs / (1000 * 60 * 60));
            const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

            return res.status(403).json({
                message: `Identity is locked. Change allowed in ${hours}h ${minutes}m`,
                remainingMs
            });
        }

        // 3. Validate inputs for new identity
        if (!avatar || !avatarType || !auraName) {
            return res.status(400).json({ message: "Avatar, type, and name are required" });
        }

        if (!['emoji', 'custom'].includes(avatarType)) {
            return res.status(400).json({ message: "Invalid avatar type" });
        }

        // 4. Update user's identity and timestamp
        user.auraAvatar = avatar;
        user.auraAvatarType = avatarType;
        user.lastAuraIdentity = {
            auraName: auraName.trim(),
            auraColor: auraColor || user.lastAuraIdentity?.auraColor || '#00F5FF'
        };
        user.lastAuraIdentityChange = now;

        await user.save();

        res.json({
            success: true,
            message: "Aura Identity updated! 24h cooldown started.",
            avatar: user.auraAvatar,
            avatarType: user.auraAvatarType,
            auraName: user.lastAuraIdentity.auraName,
            lastAuraIdentityChange: user.lastAuraIdentityChange
        });
    } catch (error) {
        console.error("Error saving aura avatar:", error);
        res.status(500).json({ message: "Server error" });
    }
};
