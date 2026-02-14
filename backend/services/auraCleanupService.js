import { AuraX } from "../models/AuraX.js";
import { DeadAuraX } from "../models/DeadAuraX.js";

/**
 * Service to migrate expired AuraX posts to DeadAuraX archive.
 * Should be called periodically (e.g., via cron or interval).
 */
export const archiveExpiredAuras = async () => {
    try {
        const now = new Date();
        // console.log(`[AuraCleanup] Checking for expired auras at ${now.toISOString()}...`);

        // 1. Find expired auras
        const expiredAuras = await AuraX.find({
            expiresAt: { $lt: now }
        }).select("+authorId").limit(100); // Process in batches

        if (expiredAuras.length === 0) return;

        // console.log(`[AuraCleanup] Found ${expiredAuras.length} expired auras. Archiving...`);

        // 2. Process each expired aura
        for (const aura of expiredAuras) {
            try {
                const vibesUpCount = aura.vibesUp?.length || 0;
                const vibesKilledCount = aura.vibesKilled?.length || 0;

                // Try to find existing archive record
                const existingArchive = await DeadAuraX.findOne({ originalAuraId: aura._id });

                if (existingArchive) {
                    // Update existing archive with final stats
                    existingArchive.vibesUpCount = vibesUpCount;
                    existingArchive.vibesKilledCount = vibesKilledCount;
                    existingArchive.views = aura.views;
                    existingArchive.archivalReason = "expired";
                    existingArchive.archivedAt = new Date(); // Update archival time to now
                    await existingArchive.save();
                } else {
                    // Fallback: Create new if not found (e.g. created before dual-write)
                    await DeadAuraX.create({
                        authorId: aura.authorId,
                        auraName: aura.auraName,
                        auraColor: aura.auraColor,
                        auraAvatar: aura.auraAvatar,
                        auraAvatarType: aura.auraAvatarType,
                        caption: aura.caption,
                        media: aura.media || null,
                        type: aura.type,
                        vibesUpCount: vibesUpCount,
                        vibesKilledCount: vibesKilledCount,
                        views: aura.views,
                        originalCreatedAt: aura.createdAt,
                        originalExpiresAt: aura.expiresAt,
                        archivalReason: "expired",
                        originalAuraId: aura._id
                    });
                }

                // 3. Delete from AuraX
                await AuraX.findByIdAndDelete(aura._id);

            } catch (innerError) {
                console.error(`[AuraCleanup] Error processing aura ${aura._id}:`, innerError);
            }
        }

        // console.log(`[AuraCleanup] Successfully processed ${expiredAuras.length} auras.`);

    } catch (error) {
        console.error("[AuraCleanup] Error archiving auras:", error);
    }
};

// Start the interval service
export const startAuraCleanupService = (intervalMs = 60000) => {
    // console.log("[AuraCleanup] Service started. Checking every", intervalMs / 1000, "seconds.");

    // Run immediately on startup
    archiveExpiredAuras();

    // Set interval
    setInterval(archiveExpiredAuras, intervalMs);
};
