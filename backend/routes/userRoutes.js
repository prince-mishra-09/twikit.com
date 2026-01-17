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
  acceptFollowRequest,
  rejectFollowRequest,
  togglePrivacy,
  removeFollower,
  blockUser,
  unblockUser,
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
router.post("/accept-request/:id", isAuth, acceptFollowRequest);
router.post("/reject-request/:id", isAuth, rejectFollowRequest);
router.post("/block/:id", isAuth, blockUser);
router.delete("/unblock/:id", isAuth, unblockUser);
router.put("/privacy", isAuth, togglePrivacy);
router.delete("/follower/:id", isAuth, removeFollower);

/* ================= ID BASED (ALWAYS LAST) ================= */
router.get("/:id", isAuth, userProfile);
router.post("/:id", isAuth, updatePassword);
router.put("/:id", isAuth, uploadFile, updateProfile);

export default router;
