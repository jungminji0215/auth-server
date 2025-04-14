import express from "express";
import {
  signin,
  signup,
  refreshToken,
  getMe,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.get("/refreshToken", refreshToken);
router.get("/me", getMe);

export default router;
