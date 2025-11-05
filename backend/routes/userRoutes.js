import e from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { followAndUnfollowUser, myProfile, updatePassword, updateProfile, userFollowerandFollowingData, userProfile } from "../controllers/userControllers.js";
import uploadFile from "../middlewares/multer.js";

const router = e.Router();
// router.get("/", (req, res) => {
//     res.json({ message: "User API root - specify '/me' or '/:id'." });
// });

router.get("/me",isAuth,myProfile)
router.get("/:id",isAuth,userProfile)
router.post("/:id",isAuth,updatePassword)
router.put("/:id",isAuth,uploadFile,updateProfile)
router.post("/follow/:id",isAuth,followAndUnfollowUser)
router.get("/followdata/:id",isAuth,userFollowerandFollowingData)
// router.get("/all",isAuth,getAllUsers)
export default router

