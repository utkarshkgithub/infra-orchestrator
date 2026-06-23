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
import { authMiddlewareJWT } from "../../middleware/auth.middleware.js";
import { prisma } from "../../lib/prisma.js";
import { ReposSchema } from "./github.types.js";

export const githubRouter = Router();

githubRouter.get("/", (req, res) => {
  const { url, state } = GithubOAuth.createAuthUrl();
  logger.info({ url, state });
  res.cookie("github_oauth_state", state, oauthStateCookieOptions);
  res.redirect(url.toString());
});

githubRouter.get("/callback", async (req, res) => {
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
  const redirectUrl = new URL("/projects", env.FRONTEND_URL);
  redirectUrl.searchParams.set("session", "1");
  res.redirect(redirectUrl.toString());
});

githubRouter.get("/repos", authMiddlewareJWT, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user!.id,
    },
    select: {
      accessToken: true,
    },
  });

  if (!user?.accessToken) {
    throw new AppError(401, "GitHub account not linked");
  }

  const githubRes = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=100",
    {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const rawRepos = await githubRes.json();
  const parsedRepos = ReposSchema.parse(rawRepos);
  res.json(parsedRepos);
});