import express from "express";
import { createPost, getAllPosts } from "../controllers/post.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllPosts);
router.post("/", authenticate, createPost);

export default router;
