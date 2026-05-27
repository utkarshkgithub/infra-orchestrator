import express from "express";
import { errorMiddleware } from "./middleware/error.middleware.js";
import cors from "cors"
import { env } from "./lib/env.js";
import cookieParser from "cookie-parser";
import authrouter from "./modules/auth/auth.routes.js"
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use("/auth",authrouter);
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use(errorMiddleware);

export default app;
