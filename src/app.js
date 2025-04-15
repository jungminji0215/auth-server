import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import postRouter from "./routes/post.route.js";

import swaggerUi from "swagger-ui-express";
import * as path from "node:path";
import * as fs from "node:fs";

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());

const swaggerPath = path.resolve("src/docs/swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api", authRoutes);
app.use("/api/posts", postRouter);

export default app;
