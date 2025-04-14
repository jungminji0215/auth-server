import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import postRouter from "./routes/post.route.js";

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/posts", postRouter);

export default app;
