import e from "express";
import registerUser, { loginUser, logoutUser, sendOTP, verifyOTP, checkUsername, forgotPassword, resetPassword } from '../controllers/authControllers.js'
import uploadFile from '../middlewares/multer.js'

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

export default router