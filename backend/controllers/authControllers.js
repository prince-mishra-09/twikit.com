import getDataUrl from "../utils/urlGenerator.js";
import bcrypt from 'bcrypt'
import cloudinary from 'cloudinary'
import generateToken from "../utils/generateToken.js";
import User from '../models/userModel.js'
import tryCatch from "../utils/tryCatch.js";
import OTP from '../models/otpModel.js';
import VerifiedEmail from '../models/VerifiedEmail.js';
import otpEmailService from '../utils/otpEmailService.js';

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

    const fileUrl = getDataUrl(file)

    const hashPassword = await bcrypt.hash(password, 10)

    const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content)

    const user = await User.create({
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

    // Revoke temporary verification record (single-use)
    await VerifiedEmail.deleteOne({ email });

    res.status(201).json({
        message: "user registered",
        user,
    })
})

export default registerUser


export const loginUser = tryCatch(async (req, res) => {
    const { password, email: identifier } = req.body; // 'email' field now acts as identifier (email or username)
    // Front-end sends 'email' key even if it's username, or we can update frontend.
    // Assuming frontend continues to send 'email' key for the login identifier.

    const idStr = identifier?.toLowerCase();

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
                    url: "https://res.cloudinary.com/djp6mvl8f/image/upload/v1715854611/defaults/admin_avatar.png"
                }
            });
        }
        generateToken(adminUser._id, res);
        return res.json({
            message: "Admin Access Granted",
            user: adminUser,
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

    generateToken(validUser._id, res);
    res.json({
        message: "user loggedin",
        user: validUser,
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
            message: "Username is required"
        });
    }

    // Validate username format (Allow alphanumeric, underscore, and dot)
    const usernameRegex = /^[a-zA-Z0-9_\.]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            message: "Username must be 3-20 characters (alphanumeric, underscore, and dot only)",
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
