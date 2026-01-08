import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createStory, deleteStory, getStoriesByUser, getStoryFeed, viewStory } from "../controllers/storyController.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post("/create", isAuth, uploadFile, createStory);
// Feature 2: Get specific user stories (Public profile)
router.get("/user/:id", isAuth, getStoriesByUser);
router.get("/feed", isAuth, getStoryFeed);
// View a story
router.post("/view/:id", isAuth, viewStory);
router.delete("/:id", isAuth, deleteStory);

export default router;
