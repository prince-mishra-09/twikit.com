import mongoose from "mongoose";

const auraXSchema = new mongoose.Schema({
    // Author ID - HIDDEN from API responses
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        select: false, // Never expose in queries
    },

    // Anonymous Identity
    auraName: {
        type: String,
        required: true,
    },
    auraColor: {
        type: String,
        required: true,
    },
    auraAvatar: {
        type: String,
        default: "👻",
    },
    auraAvatarType: {
        type: String,
        default: "emoji",
        enum: ["emoji", "custom"],
    },

    // Content
    caption: {
        type: String,
        required: true,
        maxLength: 500,
    },

    media: {
        id: String,
        url: String,
    },

    type: {
        type: String,
        default: "text",
        enum: ["text", "image", "video"],
    },

    // Engagement
    vibesUp: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],

    vibesKilled: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],

    views: {
        type: Number,
        default: 0,
    },

    // TTL for auto-deletion
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// TTL Index REMOVED - Using DeadAuraX Archival Service
// auraXSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Performance indexes
auraXSchema.index({ createdAt: -1 }); // Feed sorting
auraXSchema.index({ authorId: 1, createdAt: -1 }); // User's Auras (for "mine" endpoint)
auraXSchema.index({ vibesUp: 1 }); // Vibe lookups
auraXSchema.index({ vibesKilled: 1 }); // Vibe Kill lookups

export const AuraX = mongoose.model("AuraX", auraXSchema);
