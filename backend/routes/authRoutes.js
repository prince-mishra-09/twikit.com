import e from "express";
import registerUser, { loginUser, logoutUser } from '../controllers/authControllers.js'
import uploadFile from '../middlewares/multer.js'

const router = e.Router();


// router.post("/register",registerUser)
router.post('/register', uploadFile, registerUser);
router.post('/login',loginUser)
router.get('/logout',logoutUser)
export default router