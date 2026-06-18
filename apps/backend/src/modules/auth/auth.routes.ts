import { Router } from "express";
import { githubrouter } from "../github/github.routes.js";
import { authMiddlewareJWT } from "../../middleware/auth.middleware.js";
import { env } from "../../lib/env.js";
import { oauthStateCookieOptions, sessionCookieOptions } from "../../utils/cookie.utils.js";

const authrouter = Router();

authrouter.use("/github", githubrouter);
authrouter.use("/health", authMiddlewareJWT, (req, res) => {
  res.status(200).json({
    status: "ok",
    env: env.NODE_ENV,
  });
});

authrouter.post("/logout", (_req, res) => {
  res.clearCookie("token", sessionCookieOptions);
  res.clearCookie("github_oauth_state", oauthStateCookieOptions);
  res.status(204).end();
});

export default authrouter;
