import e from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import uploadFile from "../middlewares/multer.js";
import {
    createAuraX,
    getAllAuraX,
    handleAuraVibe,
    addAuraView,
    getUserAuras,
    deleteAuraX,
    getUserAuraIdentity,
    saveAuraAvatar,
} from "../controllers/auraXController.js";

const router = e.Router();

// Create new Aura
router.post("/new", isAuth, uploadFile, createAuraX);

// Get all Auras (feed)
router.get("/all", optionalAuth, getAllAuraX);

// Handle vibe (up/kill)
router.post("/vibe/:id", isAuth, handleAuraVibe);

// Record view
router.post("/view/:id", optionalAuth, addAuraView);

// Get user's own Auras
router.get("/mine", isAuth, getUserAuras);

// Get user's current Aura identity
router.get("/identity", isAuth, getUserAuraIdentity);

// Save user's aura avatar (onboarding)
router.post("/avatar", isAuth, saveAuraAvatar);

// Delete Aura
router.delete("/:id", isAuth, deleteAuraX);

export default router;
