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
        smtp_verify: "checking...",
        smtp_send: "checking...",
        env_check: {
            has_user: !!process.env.SMTP_USER,
            has_pass: !!process.env.SMTP_PASS,
            user_preview: process.env.SMTP_USER ? `${process.env.SMTP_USER.split('@')[0].slice(0, 3)}***@***` : 'missing'
        }
    };

    try {
        // 1. Check Database
        await Promise.race([User.findOne().limit(1), timeout(5000, "Database")]);
        diagnostic.database = "✅ Connected to MongoDB";
    } catch (err) {
        diagnostic.database = "❌ DB Error: " + err.message;
    }

    try {
        // 2. SMTP Verify
        console.log("🧪 Diagnostic: Verifying SMTP...");
        await Promise.race([otpEmailService.testConnection(), timeout(10000, "SMTP Verify")]);
        diagnostic.smtp_verify = "✅ SMTP Credentials Verified";

        // 3. SMTP Send
        console.log("🧪 Diagnostic: Sending Test Email...");
        const sendResult = await Promise.race([otpEmailService.sendTestEmail(), timeout(15000, "SMTP Send")]);

        if (sendResult.success) {
            diagnostic.smtp_send = "✅ Test Email Sent to " + process.env.SMTP_USER;
        } else {
            diagnostic.smtp_send = "❌ Mail Error: " + sendResult.error;
            diagnostic.error_details = sendResult;
        }
    } catch (err) {
        console.error("❌ Diagnostic Route Error:", err.message);
        if (diagnostic.smtp_verify === "checking...") {
            diagnostic.smtp_verify = "❌ SMTP Error: " + err.message;
        } else {
            diagnostic.smtp_send = "❌ SMTP Error: " + err.message;
        }
    }

    res.json(diagnostic);
});

export default router