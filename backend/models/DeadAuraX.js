import mongoose from "mongoose";

const deadAuraXSchema = new mongoose.Schema({
    // Original Author ID (Kept for record)
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    // Identity Snapshots
    auraName: String,
    auraColor: String,
    auraAvatar: String,
    auraAvatarType: String,

    // Content Snapshot
    caption: String,
    media: {
        id: String,
        url: String,
    },
    type: String,

    // Engagement Final Counts
    vibesUpCount: Number,
    vibesKilledCount: Number,
    views: Number,

    // Metadata
    originalCreatedAt: Date,
    originalExpiresAt: Date,
    archivedAt: {
        type: Date,
        default: Date.now,
    },

    // Reason for archiving (expired, banned, deleted_by_user)
    archivalReason: {
        type: String,
        default: "expired",
    },

    // Link to original AuraX (for updates before deletion)
    originalAuraId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuraX",
    },
});

// Index for searching archives efficiently
deadAuraXSchema.index({ authorId: 1, archivedAt: -1 });
deadAuraXSchema.index({ originalAuraId: 1 });

export const DeadAuraX = mongoose.model("DeadAuraX", deadAuraXSchema);
