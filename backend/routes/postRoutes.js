import e from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { commentonPost, deleteComment, deletePost, editCaption, getAllPosts, likeUnlikePost, newPost } from "../controllers/postController.js";
import uploadFile from "../middlewares/multer.js";

const router = e.Router();
router.post("/new", isAuth, uploadFile, newPost)

router.delete("/:id", isAuth, deletePost)

router.get("/all", isAuth, getAllPosts)
router.post("/like/:id", isAuth, likeUnlikePost)
router.post("/comment/:id", isAuth, commentonPost)
router.delete("/comment/:id", isAuth, deleteComment)
router.put("/caption/:id", isAuth, editCaption)


export default router