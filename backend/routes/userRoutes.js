import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  myProfile,
  userProfile,
  followAndUnfollowUser,
  userFollowerandFollowingData,
  updateProfile,
  updatePassword,
  searchUsers,
  getSavedPosts,
} from "../controllers/userControllers.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

/* ✅ SEARCH / ALL USERS (ALWAYS ON TOP) */
router.get("/all", isAuth, searchUsers);

/* ================= PROTECTED ================= */
router.get("/me", isAuth, myProfile);
router.get("/saved", isAuth, getSavedPosts);
router.post("/follow/:id", isAuth, followAndUnfollowUser);
router.get("/followdata/:id", isAuth, userFollowerandFollowingData);

/* ================= ID BASED (ALWAYS LAST) ================= */
router.get("/:id", isAuth, userProfile);
router.post("/:id", isAuth, updatePassword);
router.put("/:id", isAuth, uploadFile, updateProfile);

export default router;
