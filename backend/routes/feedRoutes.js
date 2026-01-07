import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { hidePost, muteUser, unhidePost, unmuteUser } from "../controllers/feedController.js";

const router = express.Router();

router.post("/hide-post/:postId", isAuth, hidePost);
router.delete("/unhide-post/:postId", isAuth, unhidePost);

router.post("/mute-user/:userId", isAuth, muteUser);
router.delete("/unmute-user/:userId", isAuth, unmuteUser);

export default router;
