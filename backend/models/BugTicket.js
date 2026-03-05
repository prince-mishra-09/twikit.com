import mongoose from "mongoose";

const bugTicketSchema = new mongoose.Schema(
    {
        ticketId: {
            type: String,
            unique: true,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
            type: String,
            enum: ["Login", "Feed", "AuraX", "Media", "Others"],
            required: true,
        },
        description: {
            type: String,
            required: true,
            maxLength: 1000,
        },
        metadata: {
            deviceType: { type: String, default: "" }, // mobile / tablet / desktop
            os: { type: String, default: "" },         // Windows / Android / iOS etc.
            browser: { type: String, default: "" },    // Chrome 120 / Safari 17 etc.
            urlLocation: { type: String, default: "" }, // e.g. /aurax, /feed, /user/:id
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "resolved"],
            default: "open",
        },
    },
    { timestamps: true }
);

// Indexes
bugTicketSchema.index({ status: 1, createdAt: -1 });
bugTicketSchema.index({ userId: 1 });

const BugTicket = mongoose.model("BugTicket", bugTicketSchema);
export default BugTicket;
