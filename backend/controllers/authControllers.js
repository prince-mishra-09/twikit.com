import getDataUrl from "../utils/urlGenerator.js";
import bcrypt from 'bcrypt'
import cloudinary from 'cloudinary'
import generateToken from "../utils/generateToken.js";
import User from '../models/userModel.js'
import tryCatch from "../utils/tryCatch.js";
import OTP from '../models/otpModel.js';
import otpEmailService from '../utils/otpEmailService.js';

const registerUser = tryCatch(async (req, res) => {
    const { name, email, password, gender, username } = req.body

    const file = req.file;

    if (!file) {
        return res.status(400).json({
            message: "Profile image is required",
        });
    }

    // Validate username is provided
    if (!username) {
        return res.status(400).json({
            message: "Username is required"
        });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            message: "Username must be 3-20 characters (alphanumeric and underscore only)"
        });
    }

    // Check if email already exists
    let user = await User.findOne({ email });

    if (user) {
        return res.status(400).json({
            message: "User already hai",
        });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return res.status(400).json({
            message: "Username already taken. Please choose another one.",
        });
    }

    const fileUrl = getDataUrl(file)

    const hashPassword = await bcrypt.hash(password, 10)

    const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content)

    user = await User.create({
        name,
        email,
        password: hashPassword,
        gender,
        username: username || null,
        profilePic: {
            id: myCloud.public_id,
            url: myCloud.secure_url
        }
    })

    // Send welcome email
    try {
        await otpEmailService.sendWelcomeEmail(email, name, username || 'User');
    } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail registration if email fails
    }

    generateToken(user._id, res)

    res.status(201).json({
        message: "user registered",
        user,
    })
})

export default registerUser


export const loginUser = tryCatch(async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user) return res.status(404).json({
        message: "wrong credential",
    })

    const comparePassword = await bcrypt.compare(password, user.password)

    if (!comparePassword) {
        return res.status(400).json({
            message: "invalid"
        })
    }

    generateToken(user._id, res);
    res.json({
        message: "user loggedin",
        user,
    })
})

export const logoutUser = tryCatch((req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
    });

    res.json({
        message: "logout successfully",
    });
});


// Send OTP to email
export const sendOTP = tryCatch(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            message: "Email already registered"
        });
    }

    // Generate 4-digit OTP
    const otp = otpEmailService.generateOTP();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Save OTP to database (expires in 10 minutes)
    await OTP.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP email
    await otpEmailService.sendOTP(email, otp);

    res.json({
        message: "OTP sent to your email"
    });
});

// Verify OTP
export const verifyOTP = tryCatch(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required"
        });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
        return res.status(400).json({
            message: "OTP expired or not found. Please request a new one."
        });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({ email });
        return res.status(400).json({
            message: "OTP has expired. Please request a new one."
        });
    }

    // Check attempts (max 3)
    if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ email });
        return res.status(400).json({
            message: "Too many failed attempts. Please request a new OTP."
        });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
            message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
        });
    }

    // OTP is correct - delete it
    await OTP.deleteOne({ email });

    res.json({
        message: "Email verified successfully",
        verified: true
    });
});

// Check username availability
export const checkUsername = tryCatch(async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({
            message: "Username is required"
        });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            message: "Username must be 3-20 characters (alphanumeric and underscore only)",
            available: false
        });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
        return res.json({
            available: false,
            message: "Username already taken"
        });
    }

    res.json({
        available: true,
        message: "Username is available"
    });
});

// Forgot Password - Send OTP
export const forgotPassword = tryCatch(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            message: "No account found with this email"
        });
    }

    // Generate 4-digit OTP
    const otp = otpEmailService.generateOTP();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Save OTP to database (expires in 10 minutes)
    await OTP.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP email
    await otpEmailService.sendOTP(email, otp);

    res.json({
        message: "Password reset code sent to your email"
    });
});

// Reset Password - Verify OTP and update password
export const resetPassword = tryCatch(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({
            message: "Email, OTP, and new password are required"
        });
    }

    // Validate password length
    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
        return res.status(400).json({
            message: "OTP expired or not found. Please request a new one."
        });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({ email });
        return res.status(400).json({
            message: "OTP has expired. Please request a new one."
        });
    }

    // Check attempts (max 3)
    if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ email });
        return res.status(400).json({
            message: "Too many failed attempts. Please request a new OTP."
        });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
            message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
        });
    }

    // OTP is correct - update password
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    // Hash new password
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();

    // Delete OTP
    await OTP.deleteOne({ email });

    res.json({
        message: "Password reset successfully. You can now login with your new password."
    });
});
