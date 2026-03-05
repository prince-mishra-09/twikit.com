import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { submitBug } from "../controllers/bugController.js";

const router = express.Router();

// POST /api/bugs/report — Auth required (rate limiting handled inside controller via Redis)
router.post("/report", isAuth, submitBug);

export default router;
