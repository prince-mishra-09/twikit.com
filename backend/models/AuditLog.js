import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            required: true,
            // e.g. BAN_USER, UNBAN_USER, CHANGE_POST_STATUS, CHANGE_AURAX_STATUS, MARK_BUG_FIXED, CHANGE_BUG_STATUS
        },
        targetType: {
            type: String,
            enum: ["user", "post", "aurax", "bug"],
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

// Indexes for performance
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
