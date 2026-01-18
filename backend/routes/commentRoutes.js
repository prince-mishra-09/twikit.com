import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { createComment, deleteComment, getPostComments } from "../controllers/commentController.js";

const router = express.Router();



router.post("/:postId", isAuth, createComment);
router.get("/:postId", optionalAuth, getPostComments);
router.delete("/:id", isAuth, deleteComment);

export default router;
