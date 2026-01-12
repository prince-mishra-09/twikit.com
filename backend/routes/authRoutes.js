import e from "express";
import registerUser, { loginUser, logoutUser, sendOTP, verifyOTP, checkUsername, forgotPassword, resetPassword } from '../controllers/authControllers.js'
import uploadFile from '../middlewares/multer.js'
import otpEmailService from "../utils/otpEmailService.js";

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
// router.all('/test-email', (req, res) => {
//     otpEmailService.testConnection().then(status => {
//         res.json({
//             success: status,
//             message: status ? "Email service is working" : "Email service connection failed",
//             config: {
//                 host: process.env.SMTP_HOST,
//                 port: process.env.SMTP_PORT,
//                 user: process.env.SMTP_USER
//             }
//         });
//     });
// });

export default router