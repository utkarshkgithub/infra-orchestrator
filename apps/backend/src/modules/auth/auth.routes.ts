import { Router } from "express";
import { githubrouter } from "../github/github.routes.js";
import { authMiddlewareJWT } from "../../middleware/auth.middleware.js";
import { env } from "../../lib/env.js";
import {
  oauthStateCookieOptions,
  sessionCookieOptions,
} from "../../utils/cookie.utils.js";
import { prisma } from "../../lib/prisma.js";
import { devLogin } from "./auth.controller.js";

const authrouter = Router();

authrouter.use("/github", githubrouter);
authrouter.post("/dev-login",devLogin)
authrouter.use("/health", authMiddlewareJWT, (req, res) => {
  res.status(200).json({
    status: "ok",
    env: env.NODE_ENV,
  });
});

authrouter.get("/me", authMiddlewareJWT, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, login: true, avatarUrl: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.status(200).json(user);
});

authrouter.post("/logout", (_req, res) => {
  res.clearCookie("token", sessionCookieOptions);
  res.clearCookie("github_oauth_state", oauthStateCookieOptions);
  res.status(204).end();
});

export default authrouter;
