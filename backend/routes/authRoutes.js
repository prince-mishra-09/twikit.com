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
    const diagnostic = {
        timestamp: new Date().toISOString(),
        database: "checking...",
        smtp_verify: "checking...",
        smtp_send: "checking...",
        config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            secure_detected: (parseInt(process.env.SMTP_PORT) === 465 || process.env.SMTP_SECURE === 'true')
        }
    };

    try {
        // 1. Check Database
        await User.findOne().limit(1);
        diagnostic.database = "✅ Connected to MongoDB";
    } catch (err) {
        diagnostic.database = "❌ DB Error: " + err.message;
    }

    try {
        // 2. SMTP Verify
        await otpEmailService.testConnection();
        diagnostic.smtp_verify = "✅ SMTP Credentials Verified";

        // 3. SMTP Send
        const sendResult = await otpEmailService.sendTestEmail();
        if (sendResult.success) {
            diagnostic.smtp_send = "✅ Test Email Sent to " + process.env.SMTP_USER;
        } else {
            diagnostic.smtp_send = "❌ Mail Error: " + sendResult.error;
            diagnostic.error_details = sendResult;
        }
    } catch (err) {
        diagnostic.smtp_verify = "❌ SMTP Error: " + err.message;
    }

    res.json(diagnostic);
});

export default router