import { Router } from "express";
import { GithubOAuth } from "./github.oauth.js";
import { oauthStateCookieOptions } from "../../utils/cookie.utils.js";
import { githubProvider } from "./github.provider.js";
import { createUser } from "../auth/auth.service.js";
import { logger } from "../../lib/logger.js";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../lib/env.js";
import { sessionCookieOptions } from "../../utils/cookie.utils.js";
import { authMiddlewareJWT } from "../../middleware/auth.middleware.js";
import { listInstalledRepos, getRepoHeadCommit } from "../../lib/githubApp.js";

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
  
  // save in db the profile
  const user = await createUser(githubUser);
  
  // create session/JWT
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
  // Only repos the GitHub App is installed on — those are the only ones that
  // can deploy (single authenticated clone path) and auto-deploy on push.
  // Same response shape the frontend already consumes.
  const repos = await listInstalledRepos();
  res.json(
    repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.fullName,
      html_url: `https://github.com/${repo.fullName}`,
      clone_url: repo.cloneUrl,
      default_branch: repo.defaultBranch,
      updated_at: repo.updatedAt,
    })),
  );
});

// Head commit of a repo's default branch, resolved server-side with the app
// installation token. Null when the app is not on the repo (frontend treats
// it as "user pastes the SHA").
githubRouter.get("/head-commit", authMiddlewareJWT, async (req, res) => {
  const fullName = req.query.repo?.toString() ?? "";
  const sha = fullName ? await getRepoHeadCommit(fullName) : null;
  res.json({ sha });
});