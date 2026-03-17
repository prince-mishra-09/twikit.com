import bcrypt from 'bcrypt'
import fs from "fs";
import { uploadFile } from '../utils/imagekit.js';
import generateToken from "../utils/generateToken.js";
import User from '../models/userModel.js'
import tryCatch from "../utils/tryCatch.js";
import OTP from '../models/otpModel.js';
import VerifiedEmail from '../models/VerifiedEmail.js';
import otpEmailService from '../utils/otpEmailService.js';
import Session from '../models/Session.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const registerUser = tryCatch(async (req, res) => {
    const { name, gender, username } = req.body
    const email = req.body.email?.toLowerCase();
    const password = req.body.password;

    if (password && password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        });
    }

    const file = req.file;

    // Profile pic is optional — use default if not provided
    let profilePicData = {
        id: "default",
        url: "/images/default-avatar.png"
    };

    if (file) {
        const myCloud = await uploadFile(file.path, file.originalname, "profile-pics");
        profilePicData = { id: myCloud.id, url: myCloud.url };

        // Cleanup local file
        try { fs.unlinkSync(file.path); } catch (_) {}
    }

    // Validate username is provided
    if (!username) {
        return res.status(400).json({
            message: "Username is required"
        });
    }

    // Validate username format (Allow alphanumeric, underscore, and dot)
    const usernameRegex = /^[a-zA-Z0-9_\.]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            message: "Username must be 3-20 characters (alphanumeric, underscore, and dot only)"
        });
    }

    // Check if email has reached max 10 users
    const emailUserCount = await User.countDocuments({ email });
    if (emailUserCount >= 10) {
        return res.status(400).json({
            message: "Maximum 10 accounts allowed per email address.",
        });
    }

    // MANDATORY OTP CHECK: Verify email has been validated via OTP recently
    const isVerified = await VerifiedEmail.findOne({ email });
    if (!isVerified) {
        return res.status(401).json({
            message: "Email not verified. Please complete OTP verification first."
        });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return res.status(400).json({
            message: "Username already taken. Please choose another one.",
        });
    }

    const hashPassword = await bcrypt.hash(password, 10)

    let user;
    try {
        user = await User.create({
            name,
            email,
            password: hashPassword,
            gender: gender || "",
            username: username || null,
            profilePic: profilePicData
        })
    } catch (error) {
        if (error.code === 11000) {
            console.error("DUPLICATE KEY ERROR DETAILS:", error.keyValue);
            const field = Object.keys(error.keyValue)[0];
            const displayField = field.charAt(0).toUpperCase() + field.slice(1);
            return res.status(400).json({
                message: `${displayField} already taken. Please choose another one.`,
            });
        }
        throw error; // Let tryCatch middleware handle other errors
    }

    // Send welcome email
    try {
        await otpEmailService.sendWelcomeEmail(email, name, username || 'User');
    } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail registration if email fails
    }

    const { accessToken, refreshToken } = await generateToken(user._id, req, res)

    // Revoke temporary verification record (single-use)
    await VerifiedEmail.deleteOne({ email });

    res.status(201).json({
        message: "user registered",
        user,
        accessToken,
        refreshToken
    })
})

export default registerUser


export const loginUser = tryCatch(async (req, res) => {
    const { password, email, identifier: bodyIdentifier } = req.body;
    const identifier = bodyIdentifier || email; // Fallback to 'email' if 'identifier' is missing (backward compatibility)

    if (!identifier) {
        return res.status(400).json({ message: "Email or username is required" });
    }

    const idStr = identifier.toLowerCase();

    // Strategy:
    // 1. Try to find by username first (Exact match)
    // 2. If not found, find ALL users by email.
    // 3. Check password against matches.

    // --- SPECIAL ADMIN BYPASS ---
    if (idStr === "admin@prince") {
        if (password !== "123456") {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        let adminUser = await User.findOne({ email: "admin@prince" });
        if (!adminUser) {
            // Auto-create admin if not exists (Internal use only)
            const hashPassword = await bcrypt.hash("123456", 10);
            adminUser = await User.create({
                name: "Admin Prince",
                email: "admin@prince",
                password: hashPassword,
                gender: "Male",
                username: "admin_prince",
                profilePic: {
                    id: "admin_default",
                    url: "https://ik.imgkit.net/jzlcvc50c/defaults/admin_avatar.png"
                }
            });
        }
        const { accessToken, refreshToken } = await generateToken(adminUser._id, req, res);
        return res.json({
            message: "Admin Access Granted",
            user: adminUser,
            accessToken,
            refreshToken
        });
    }

    let potentialUsers = [];

    // 1. Check Username
    const userByUsername = await User.findOne({ username: idStr });
    if (userByUsername) {
        potentialUsers.push(userByUsername);
    } else {
        // 2. Check Email (Find ALL)
        const usersByEmail = await User.find({ email: idStr });
        if (usersByEmail.length > 0) {
            potentialUsers = usersByEmail;
        }
    }

    if (potentialUsers.length === 0) {
        return res.status(404).json({
            message: "User not found",
        })
    }

    // 3. Check Passwords
    let validUser = null;

    for (const user of potentialUsers) {
        const comparePassword = await bcrypt.compare(password, user.password);
        if (comparePassword) {
            validUser = user;
            break; // Login the first valid one found
        }
    }

    if (!validUser) {
        return res.status(400).json({
            message: "Invalid credentials"
        })
    }

    const { accessToken, refreshToken } = await generateToken(validUser._id, req, res);
    res.json({
        message: "user loggedin",
        user: validUser,
        accessToken,
        refreshToken
    })
})

export const logoutUser = tryCatch(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
        await Session.deleteOne({ refreshToken });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const commonOptions = {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
    };

    res.clearCookie("accessToken", commonOptions);
    res.clearCookie("refreshToken", commonOptions);

    res.json({
        message: "logout successfully",
    });
});

export const refreshAccessToken = tryCatch(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token missing" });
    }

    const session = await Session.findOne({ refreshToken });

    if (!session || session.expiresAt < new Date()) {
        if (session) await Session.deleteOne({ _id: session._id });
        return res.status(401).json({ message: "Session expired or invalid" });
    }

    // Optional: Refresh Token Rotation (Industry Level)
    const newRefreshToken = crypto.randomBytes(40).toString("hex");

    // Update session with new refresh token
    session.refreshToken = newRefreshToken;
    session.lastActive = new Date();
    await session.save();

    // Generate new Access Token
    const accessToken = jwt.sign({ _id: session.userId }, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    };

    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    res.json({ accessToken, refreshToken: newRefreshToken });
});


// Send OTP to email
export const sendOTP = tryCatch(async (req, res) => {
    const email = req.body.email?.toLowerCase();

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    // Check if email has reached max 10 users
    const emailUserCount = await User.countDocuments({ email });
    if (emailUserCount >= 10) {
        return res.status(400).json({
            message: "Maximum 10 accounts allowed per email address."
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

    // Grant temporary verification status for registration (expires in 10 mins)
    await VerifiedEmail.deleteMany({ email }); // Clear any stale ones
    await VerifiedEmail.create({ email });

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
            message: "Username is required",
            available: false
        });
    }

    // Validate username format (Allow alphanumeric, underscore, and dot)
    const usernameRegex = /^[a-zA-Z0-9_\.]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            message: "Invalid format (3-20 chars, alphanumeric/./_ only)",
            available: false,
            errorType: "invalid_format"
        });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
        return res.json({
            available: false,
            message: "Username already taken",
            errorType: "already_taken"
        });
    }

    res.json({
        available: true,
        message: "Username is available"
    });
});

// Suggest usernames based on name
export const suggestUsernames = tryCatch(async (req, res) => {
    const name = req.query.name?.trim();
    if (!name || name.length < 2) {
        return res.json({ suggestions: [] });
    }

    // Build slug from name: "Prince Mishra" → "prince_mishra"
    const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 15);
    const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    const lastName = (name.split(' ')[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);

    const rand2 = () => String(Math.floor(Math.random() * 90) + 10);       // 2-digit
    const rand4 = () => String(Math.floor(Math.random() * 9000) + 1000);   // 4-digit

    // Generate candidate suggestions
    const candidates = [
        slug,
        `${firstName}${lastName ? '.' + lastName : ''}`,
        `${firstName}_${rand2()}`,
        `${slug}${rand4()}`,
        `the.${firstName}`,
        `${firstName}${rand4()}`,
        `i.am.${firstName}`,
        `${firstName}.${lastName || rand2()}`,
    ]
    .map(u => u.replace(/[^a-z0-9_.]/g, '').slice(0, 20))
    .filter(u => /^[a-z0-9_.]{3,20}$/.test(u));

    // Deduplicate
    const unique = [...new Set(candidates)].slice(0, 6);

    // Check availability in ONE query
    const taken = await User.find({ username: { $in: unique } }).select('username').lean();
    const takenSet = new Set(taken.map(u => u.username));

    const suggestions = unique.filter(u => !takenSet.has(u)).slice(0, 4);

    res.json({ suggestions });
});

// Forgot Password - Send OTP
export const forgotPassword = tryCatch(async (req, res) => {
    const email = req.body.email?.toLowerCase();

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
