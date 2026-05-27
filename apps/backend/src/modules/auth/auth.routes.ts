import { Router } from "express";
import { githubrouter } from "../github/github.routes.js";
import { authMiddlewareJWT } from "../../middleware/auth.middleware.js";
import { env } from "../../lib/env.js";

const authrouter = Router();

authrouter.use("/github", githubrouter);
authrouter.use("/health", authMiddlewareJWT, (req, res) => {
  res.status(200).json({
    status: "ok",
    env: env.NODE_ENV,
  });
});

export default authrouter;
