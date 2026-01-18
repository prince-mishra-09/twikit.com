import e from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { deletePost, editCaption, getAllPosts, getRandomPosts, handleFeedback, newPost, saveUnsavePost, getPost, addPostView, getUserPosts } from "../controllers/postController.js";
import uploadFile from "../middlewares/multer.js";

const router = e.Router();
router.post("/new", isAuth, uploadFile, newPost)


router.get("/all", optionalAuth, getAllPosts)
router.post("/feedback/:id", isAuth, handleFeedback)

router.put("/caption/:id", isAuth, editCaption)
router.post("/view/:id", optionalAuth, addPostView)
router.post("/save/:id", isAuth, saveUnsavePost)
router.delete("/:id", isAuth, deletePost)
router.get("/random", optionalAuth, getRandomPosts)
router.get("/:id", optionalAuth, getPost)
router.get("/user/:id", optionalAuth, getUserPosts)



export default router