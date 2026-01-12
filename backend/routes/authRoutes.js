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
        results: []
    };

    try {
        await Promise.race([User.findOne().limit(1), timeout(5000, "Database")]);
        diagnostic.database = "✅ Connected to MongoDB";
    } catch (err) {
        diagnostic.database = "❌ DB Error: " + err.message;
    }

    const portsToTest = [465, 587];
    for (const port of portsToTest) {
        const portResult = {
            port: port,
            verified: "checking...",
            sent: "pending..."
        };

        try {
            console.log(`🧪 Diagnostic: Testing Port ${port}...`);
            const transporter = otpEmailService.getTransporter({ port });

            await Promise.race([transporter.verify(), timeout(10000, `Verify Port ${port}`)]);
            portResult.verified = "✅ Success";

            const sendResult = await Promise.race([otpEmailService.sendTestEmail(), timeout(15000, `Send Port ${port}`)]);
            if (sendResult.success) {
                portResult.sent = "✅ Success";
            } else {
                portResult.sent = "❌ Error: " + sendResult.error;
            }
        } catch (err) {
            console.error(`❌ Port ${port} Failed:`, err.message);
            portResult.verified = "❌ " + err.message;
        }
        diagnostic.results.push(portResult);
    }

    res.json(diagnostic);
});

export default router