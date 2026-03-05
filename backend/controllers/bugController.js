import BugTicket from "../models/BugTicket.js";
import { Notification } from "../models/Notification.js";
import redis from "../utils/redis.js";
import TryCatch from "../utils/tryCatch.js";
import { getIO } from "../socket/socketIO.js";

// ============================================================
// POST /api/bugs/report
// ============================================================
export const submitBug = TryCatch(async (req, res) => {
    const userId = req.user._id;
    const { category, description, metadata } = req.body;

    if (!category || !description) {
        return res.status(400).json({ message: "Category and description are required." });
    }

    // --- Redis Rate Limit: 2 per hour per user ---
    const rateKey = `bug_report:${userId}`;
    const currentCount = await redis.get(rateKey);

    if (currentCount && parseInt(currentCount) >= 2) {
        return res.status(429).json({
            message: "Too many bug reports. You can submit up to 2 bug reports per hour. Please try again later.",
        });
    }

    // Increment counter (or set with 1-hour TTL first time)
    if (!currentCount) {
        await redis.set(rateKey, "1", "EX", 3600);
    } else {
        await redis.incr(rateKey);
        // Preserve existing TTL — don't reset it
    }

    // --- Generate Ticket ID ---
    const totalTickets = await BugTicket.countDocuments();
    const ticketId = `WAKED-${String(totalTickets + 1).padStart(3, "0")}`;

    // --- Save Ticket ---
    const ticket = await BugTicket.create({
        ticketId,
        userId,
        category,
        description,
        metadata: {
            deviceType: metadata?.deviceType || "",
            os: metadata?.os || "",
            browser: metadata?.browser || "",
            urlLocation: metadata?.urlLocation || "",
        },
    });

    // --- Confirmation Notification (bug_receipt) ---
    const receiptMsg = `Thanks! Ticket #${ticketId} receive ho gaya hai. Hum jald se jald isse fix karenge. 🙏`;
    const notification = await Notification.create({
        receiver: userId,
        sender: userId, // System notification from self
        type: "bug_receipt",
        message: receiptMsg,
        ticketId,
    });

    // Real-time push
    try {
        getIO().to(`user:${userId.toString()}`).emit("notification:new", notification);
    } catch (e) { /* socket not critical */ }

    res.status(201).json({
        message: "Bug report submitted successfully!",
        ticketId,
        ticket,
    });
});
