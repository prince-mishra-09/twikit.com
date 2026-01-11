// OTP Model - Temporary storage for email verification OTPs
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Auto-delete when expired
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster lookups
otpSchema.index({ email: 1 });

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
