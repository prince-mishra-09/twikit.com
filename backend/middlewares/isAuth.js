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

    // Support both decoded._id and decoded.id (different JWT sign formats)
    const userId = decoded._id || decoded.id;
    // SELECT email + role explicitly — isAdmin middleware needs them
    req.user = await User.findById(userId).select("-password +email +role +isShadowBanned");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    // --- MAINTENANCE MODE BYPASS (env-var based) ---
    if (process.env.MAINTENANCE_MODE === "true" && req.user.email !== "admin@prince") {
      return res.status(503).json({
        message: "Website is under maintenance. Please try again later.",
        maintenance: true,
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
