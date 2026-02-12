import express from "express";
import { archiveExpiredAuras } from "../services/auraCleanupService.js";

const router = express.Router();

router.get("/force-cleanup", async (req, res) => {
    try {
        console.log("Manual cleanup triggered via API...");
        await archiveExpiredAuras();
        res.json({ message: "Cleanup triggered. Check terminal logs." });
    } catch (error) {
        console.error("Manual cleanup failed:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
