import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createStory, getStoryFeed, viewStory, deleteStory } from "../controllers/storyController.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post("/create", isAuth, uploadFile, createStory);
router.get("/feed", isAuth, getStoryFeed);
router.post("/view/:id", isAuth, viewStory);
router.delete("/:id", isAuth, deleteStory);

export default router;
