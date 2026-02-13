import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded._id).select("-password");

        // If token is invalid or user not found, treat as guest instead of erroring
        if (!req.user) {
            req.user = null;
        }

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};
