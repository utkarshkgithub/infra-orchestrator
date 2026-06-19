import { Router } from "express";
import { GithubOAuth } from "./github.oauth.js";
import { oauthStateCookieOptions } from "../../utils/cookie.utils.js";
import { githubProvider } from "./github.provider.js";
import { AppError } from "../../middleware/error.middleware.js";
import { createUser } from "../auth/auth.service.js";
import { logger } from "../../lib/logger.js";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../lib/env.js";
import { sessionCookieOptions } from "../../utils/cookie.utils.js";

export const githubrouter = Router();

githubrouter.get("/", (req, res) => {
  const { url, state } = GithubOAuth.createAuthUrl();
  logger.info({ url, state });
  res.cookie("github_oauth_state", state, oauthStateCookieOptions);
  res.redirect(url.toString());
});

githubrouter.get("/callback", async (req, res) => {
  const state = req.query.state?.toString();
  const code = req.query.code?.toString();
  const storedState = req.cookies?.github_oauth_state;
  // logger.info({state,code,storedState});
  if (!state || !code || !storedState || storedState !== state) {
    res
      .status(400)
      .json({ error: "Invalid OAuth state or missing parameters" });
    return;
  }
  const githubUser = await GithubOAuth.handleCallbackURL(code);
  res.clearCookie("github_oauth_state");
  // TODO: save in db the profile
  const user = await createUser(githubUser);
  // TODO create session/JWT

  const token = jwt.sign(
    {
      userId: user.id,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as SignOptions,
  );
  res.cookie("token", token, sessionCookieOptions);
  res.redirect("https://www.shipwebsite.tech/dashboard");
});
