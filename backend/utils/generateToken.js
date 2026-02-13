import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import crypto from "crypto";

const generateToken = async (userId, req, res) => {
  // 1. Generate Access Token (Short-lived)
  const accessToken = jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // 2. Generate Refresh Token (Random string)
  const refreshToken = crypto.randomBytes(40).toString("hex");

  // 3. Store Session in Database
  // We allow multiple sessions per user (multi-device support)
  await Session.create({
    userId,
    refreshToken,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  // 4. Set Cookies for Web (HttpOnly for security)
  const cookieOptions = {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // Refresh token duration
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Return tokens for Mobile App (they don't use cookies automatically)
  return { accessToken, refreshToken };
};

export default generateToken;
