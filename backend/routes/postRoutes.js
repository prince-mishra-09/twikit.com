import e from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { deletePost, editCaption, getAllPosts, getRandomPosts, likeUnlikePost, newPost, saveUnsavePost, getPost, addPostView } from "../controllers/postController.js";
import uploadFile from "../middlewares/multer.js";

const router = e.Router();
router.post("/new", isAuth, uploadFile, newPost)


router.get("/all", isAuth, getAllPosts)
router.post("/like/:id", isAuth, likeUnlikePost)

router.put("/caption/:id", isAuth, editCaption)
router.post("/view/:id", isAuth, addPostView)
router.post("/save/:id", isAuth, saveUnsavePost)
router.delete("/:id", isAuth, deletePost)
router.get("/random", isAuth, getRandomPosts)
router.get("/:id", isAuth, getPost)



export default router