import { Router } from "express";
import { GithubOAuth } from "./github.oauth.js";
import { oauthStateCookieOptions } from "../../utils/cookie.utils.js";
import { githubProvider } from "./github.provider.js";
import { AppError } from "../../middleware/error.middleware.js";
const router = Router();

router.get("/auth/github", async (req, res) => {
  const { url, state } = GithubOAuth.createAuthUrl();
  res.cookie("github_oauth_state", state, oauthStateCookieOptions);
  res.redirect(url.toString());
});

router.get("/auth/github/callback", async (req, res) => {
  const state = req.query.state?.toString();
  const code = req.query.code?.toString();
  const storedState = req.cookies?.github_oauth_state;

  if (!state || !code || !storedState || storedState !== state) {
    res
      .status(400)
      .json({ error: "Invalid OAuth state or missing parameters" });
    return;
  }
    const githubUser = await GithubOAuth.handleCallbackURL(code);
    res.clearCookie("github_oauth_state");
    // TODO: save in db the profile

    res.status(201).json({
      status: true,
      user: githubUser,
      message: "Authentication successful",
    });
    
});
