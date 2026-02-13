import e from "express";
import registerUser, { loginUser, logoutUser, sendOTP, verifyOTP, checkUsername, forgotPassword, resetPassword } from '../controllers/authControllers.js'
import uploadFile from '../middlewares/multer.js'
import otpEmailService from "../utils/otpEmailService.js";

import User from '../models/userModel.js';

const router = e.Router();


// router.post("/register",registerUser)
router.post('/register', uploadFile, registerUser);
router.post('/login', loginUser)
router.get('/logout', logoutUser)

// OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Username check
router.post('/check-username', checkUsername);

// Forgot Password routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Diagnostic routes
router.all('/test-email', async (req, res) => {
    const timeout = (ms, step) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout at step: ${step}`)), ms)
    );

    const diagnostic = {
        timestamp: new Date().toISOString(),
        database: "checking...",
        resend_api: "checking...",
        email_send: "pending..."
    };

    try {
        await Promise.race([User.findOne().limit(1), timeout(5000, "Database")]);
        diagnostic.database = "✅ Connected to MongoDB";
    } catch (err) {
        diagnostic.database = "❌ DB Error: " + err.message;
    }

    try {
        // console.log("🧪 Diagnostic: Testing Resend API...");
        const isReady = await Promise.race([otpEmailService.testConnection(), timeout(10000, "Resend API")]);
        diagnostic.resend_api = isReady ? "✅ Connected to Resend API" : "❌ API Check Failed (Check Key)";

        if (isReady) {
            // console.log("🧪 Diagnostic: Sending Test Email...");
            const sendResult = await Promise.race([otpEmailService.sendTestEmail(), timeout(15000, "Resend Send")]);
            if (sendResult.success) {
                diagnostic.email_send = "✅ Test Email Sent to Admin";
            } else {
                diagnostic.email_send = "❌ Send Failed: " + (sendResult.error || "Unknown error");
            }
        }
    } catch (err) {
        console.error("❌ Diagnostic Failed:", err.message);
        diagnostic.resend_api = "❌ Error: " + err.message;
    }

    res.json(diagnostic);
});

export default router