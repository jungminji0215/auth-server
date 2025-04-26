import express from "express";
import {
  signin,
  signup,
  refreshToken,
  getMe,
  signout,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.post("/signout", authenticate, signout);

router.get("/refreshToken", refreshToken);
router.get("/me", authenticate, getMe);

export default router;
