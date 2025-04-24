import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import postRouter from "./routes/post.route.js";

import swaggerUi from "swagger-ui-express";
import * as path from "node:path";
import * as fs from "node:fs";
import morgan from "morgan";

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_WHITELIST,
    credentials: true,
  }),
);

app.use(express.json());
app.use(morgan("dev"));
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

const swaggerPath = path.resolve("src/docs/swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api", authRoutes);
app.use("/api/posts", postRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
