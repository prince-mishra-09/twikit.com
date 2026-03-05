import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
    getStats,
    getBugs,
    updateBugStatus,
    markBugFixed,
    getUsers,
    toggleShadowBan,
    updatePostStatus,
    updateAuraXStatus,
    getAuditLogs,
    getAdminPosts,
    getAdminAuraX,
    toggleMaintenance,
    getMaintenanceStatus,
    getSystemHealth,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require authentication + admin role + (optional) IP whitelist
router.use(isAuth, isAdmin);

// Stats
router.get("/stats", getStats);

// Bug Tickets
router.get("/bugs", getBugs);
router.patch("/bugs/:id/status", updateBugStatus);
router.post("/bugs/:id/mark-fixed", markBugFixed);

// User Moderation
router.get("/users", getUsers);
router.patch("/users/:id/shadow-ban", toggleShadowBan);

// Content Moderation — Feed Posts
router.patch("/posts/:id/status", updatePostStatus);

// Content Moderation — AuraX Posts
router.patch("/aurax/:id/status", updateAuraXStatus);

// Audit Logs
router.get("/audit-logs", getAuditLogs);

// Content Moderation — List views
router.get("/posts", getAdminPosts);
router.get("/aurax", getAdminAuraX);

// Maintenance (Global Kill Switch)
router.get("/maintenance", getMaintenanceStatus);
router.post("/maintenance", toggleMaintenance);

// System Health
router.get("/system-health", getSystemHealth);

export default router;
