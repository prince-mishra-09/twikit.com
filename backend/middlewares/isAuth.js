import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const isAuth = async (req, res, next) => {
  try {
    // Get token from Cookies (Web) or Authorization Header (Mobile App)
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Login required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // req.user = await User.findById(decoded.id).select("-password");
    req.user = await User.findById(decoded._id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    // --- MAINTENANCE MODE BYPASS ---
    if (process.env.MAINTENANCE_MODE === "true" && req.user.email !== "admin@prince") {
      return res.status(503).json({
        message: "Website is under maintenance. Please try again later.",
        maintenance: true
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
