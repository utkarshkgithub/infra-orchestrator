import express from "express";
import { errorMiddleware } from "./middleware/error.middleware.js";
import cors from "cors"
import { env } from "./lib/env.js";
import cookieParser from "cookie-parser";
import authrouter from "./modules/auth/auth.routes.js"
import projectRouter from "./modules/projects/projects.routes.js";
import { authMiddlewareJWT } from "./middleware/auth.middleware.js";
import deploymentRouter from "./modules/deployments/deployments.routes.js";


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use("/auth",authrouter);
app.use("/project",authMiddlewareJWT,projectRouter);
app.use("/deployment",authMiddlewareJWT,deploymentRouter);
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use(errorMiddleware);

export default app;
