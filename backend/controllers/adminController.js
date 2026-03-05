import BugTicket from "../models/BugTicket.js";
import AuditLog from "../models/AuditLog.js";
import User from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import { AuraX } from "../models/AuraX.js";
import { Notification } from "../models/Notification.js";
import TryCatch from "../utils/tryCatch.js";
import { getIO } from "../socket/socketIO.js";
import redis from "../utils/redis.js";

// --- Shared helper: log admin action ---
const logAction = async (adminId, action, targetType, targetId, details = {}) => {
    await AuditLog.create({ adminId, action, targetType, targetId, details });
};

// ============================================================
// GET /api/admin/stats
// ============================================================
export const getStats = TryCatch(async (req, res) => {
    const [open, inProgress, resolved, totalUsers] = await Promise.all([
        BugTicket.countDocuments({ status: "open" }),
        BugTicket.countDocuments({ status: "in_progress" }),
        BugTicket.countDocuments({ status: "resolved" }),
        User.countDocuments(),
    ]);

    const total = open + inProgress + resolved;
    const burnRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    res.json({ open, inProgress, resolved, total, burnRate, totalUsers });
});

// ============================================================
// GET /api/admin/bugs?status=open&page=1&limit=20
// ============================================================
export const getBugs = TryCatch(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bugs, total] = await Promise.all([
        BugTicket.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("userId", "name username email profilePic"),
        BugTicket.countDocuments(filter),
    ]);

    res.json({ bugs, total, page: parseInt(page), hasMore: skip + bugs.length < total });
});

// ============================================================
// PATCH /api/admin/bugs/:id/status  { status: "in_progress" | "open" | "resolved" }
// ============================================================
export const updateBugStatus = TryCatch(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await BugTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });

    const oldStatus = ticket.status;
    ticket.status = status;
    await ticket.save();

    await logAction(req.user._id, "CHANGE_BUG_STATUS", "bug", ticket._id, {
        ticketId: ticket.ticketId,
        from: oldStatus,
        to: status,
    });

    res.json({ message: "Bug status updated.", ticket });
});

// ============================================================
// POST /api/admin/bugs/:id/mark-fixed
// ============================================================
export const markBugFixed = TryCatch(async (req, res) => {
    const { id } = req.params;

    const ticket = await BugTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });

    ticket.status = "resolved";
    await ticket.save();

    // Send "Fixed!" notification to the user
    const fixMsg = `Good news! Jo bug aapne report kiya tha (#${ticket.ticketId}), use humne fix kar diya hai. Thanks for helping us grow! 🚀`;
    const notification = await Notification.create({
        receiver: ticket.userId,
        sender: req.user._id,
        type: "bug_fixed",
        message: fixMsg,
        ticketId: ticket.ticketId,
    });

    try {
        getIO().to(`user:${ticket.userId.toString()}`).emit("notification:new", notification);
    } catch (e) { /* not critical */ }

    await logAction(req.user._id, "MARK_BUG_FIXED", "bug", ticket._id, {
        ticketId: ticket.ticketId,
        notifiedUser: ticket.userId,
    });

    res.json({ message: `Bug ${ticket.ticketId} marked as fixed. User notified.` });
});

// ============================================================
// GET /api/admin/users?search=&page=1
// ============================================================
export const getUsers = TryCatch(async (req, res) => {
    const { search = "", page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = search
        ? { $or: [{ name: { $regex: search, $options: "i" } }, { username: { $regex: search, $options: "i" } }] }
        : {};

    const [users, total] = await Promise.all([
        User.find(filter)
            .select("name username email profilePic role isShadowBanned createdAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        User.countDocuments(filter),
    ]);

    res.json({ users, total, page: parseInt(page), hasMore: skip + users.length < total });
});

// ============================================================
// PATCH /api/admin/users/:id/shadow-ban  { isShadowBanned: true/false }
// ============================================================
export const toggleShadowBan = TryCatch(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.isShadowBanned = !user.isShadowBanned;
    await user.save();

    const action = user.isShadowBanned ? "SHADOW_BAN_USER" : "UNBAN_USER";
    await logAction(req.user._id, action, "user", user._id, { username: user.username });

    res.json({
        message: user.isShadowBanned ? `@${user.username} shadow-banned.` : `@${user.username} unbanned.`,
        isShadowBanned: user.isShadowBanned,
    });
});

// ============================================================
// PATCH /api/admin/posts/:id/status  { status: "active"|"hidden"|"burned" }
// ============================================================
export const updatePostStatus = TryCatch(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const oldStatus = post.status;
    post.status = status;
    await post.save();

    await logAction(req.user._id, "CHANGE_POST_STATUS", "post", post._id, {
        from: oldStatus,
        to: status,
        owner: post.owner,
    });

    res.json({ message: `Post status changed to '${status}'.`, post });
});

// ============================================================
// PATCH /api/admin/aurax/:id/status  { status: "active"|"hidden"|"burned" }
// ============================================================
export const updateAuraXStatus = TryCatch(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const aura = await AuraX.findById(id);
    if (!aura) return res.status(404).json({ message: "AuraX post not found." });

    const oldStatus = aura.status;
    aura.status = status;
    await aura.save();

    await logAction(req.user._id, "CHANGE_AURAX_STATUS", "aurax", aura._id, {
        from: oldStatus,
        to: status,
    });

    res.json({ message: `AuraX status changed to '${status}'.`, aura });
});

// ============================================================
// GET /api/admin/audit-logs?page=1
// ============================================================
export const getAuditLogs = TryCatch(async (req, res) => {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
        AuditLog.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("adminId", "name username profilePic"),
        AuditLog.countDocuments(),
    ]);

    res.json({ logs, total, page: parseInt(page), hasMore: skip + logs.length < total });
});

// ============================================================
// GET /api/admin/posts?page=1&limit=20  (Content Moderation view)
// ============================================================
export const getAdminPosts = TryCatch(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
        Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("owner", "name username profilePic isShadowBanned"),
        Post.countDocuments(),
    ]);

    res.json({ posts, total, page: parseInt(page), hasMore: skip + posts.length < total });
});

// ============================================================
// GET /api/admin/aurax?page=1&limit=20  (Content Moderation view)
// ============================================================
export const getAdminAuraX = TryCatch(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [auras, total] = await Promise.all([
        AuraX.find().select("+authorId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("authorId", "name username profilePic isShadowBanned"),
        AuraX.countDocuments(),
    ]);

    res.json({ auras, total, page: parseInt(page), hasMore: skip + auras.length < total });
});

// ============================================================
// POST /api/admin/maintenance  { enabled: true|false }
// Global Kill Switch — stored in Redis
// ============================================================
export const toggleMaintenance = TryCatch(async (req, res) => {
    const { enabled } = req.body;
    const value = enabled ? "true" : "false";

    // Store in Redis with no expiry (permanent until changed)
    await redis.set("maintenance:mode", value);

    await logAction(req.user._id, enabled ? "MAINTENANCE_ON" : "MAINTENANCE_OFF", "user", req.user._id, {});

    res.json({
        message: enabled ? "⚠️ Maintenance mode ENABLED. Site is locked." : "✅ Maintenance mode DISABLED. Site is live.",
        enabled,
    });
});

// ============================================================
// GET /api/admin/maintenance
// ============================================================
export const getMaintenanceStatus = TryCatch(async (req, res) => {
    const value = await redis.get("maintenance:mode");
    res.json({ enabled: value === "true" });
});

// ============================================================
// GET /api/admin/system-health
// ============================================================
export const getSystemHealth = TryCatch(async (req, res) => {
    const start = Date.now();

    // DB ping
    const [userCount, postCount, auraCount, bugCount] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        AuraX.countDocuments(),
        BugTicket.countDocuments(),
    ]);

    const dbLatency = Date.now() - start;

    // Redis ping
    let redisLatency = null;
    try {
        const redisStart = Date.now();
        await redis.get("health:ping");
        redisLatency = Date.now() - redisStart;
    } catch (e) { /* Redis might be down */ }

    res.json({
        dbLatency,
        redisLatency,
        counts: { users: userCount, posts: postCount, auras: auraCount, bugs: bugCount },
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});
