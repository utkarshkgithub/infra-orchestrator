import { generateState, OAuth2RequestError } from "arctic";
import { githubProvider } from "./github.provider.js";
import {
  GitHubEmailsSchema,
  GitHubProfileSchema,
  GitHubUser,
} from "./github.types.js";
import { AppError } from "../../middleware/error.middleware.js";
import { logger } from "../../lib/logger.js";
import { ZodError } from "zod";

export class GithubOAuth {
  // generate url
  // handle callback

  static createAuthUrl() {
    const state = generateState();
    const url = githubProvider.createAuthorizationURL(state, [
      "public_repo",
      "user:email",
      "read:user",
    ]);
    logger.info({ state, url },"state and url")
    return { state, url };
  }

  static async handleCallbackURL(code: string): Promise<GitHubUser> {
    // we want to return githubUser , use githubEmail
    let tokens;
    try {
      tokens = await githubProvider.validateAuthorizationCode(code);
    } catch (err) {
      if (err instanceof OAuth2RequestError) {
        throw new AppError(400, "Invalid or expired GitHub authorization code");
      }
      throw err;
    }
    let userRes;
    try {
      userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      });
      if (!userRes.ok) throw new AppError(502, "Failed to fetch GitHub user");
      const rawUser = await userRes.json();
      logger.info(rawUser,"Github User Details");
      const parsedUser = GitHubProfileSchema.parse(rawUser); //first parse

      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      });

      if (!emailRes.ok)
        throw new AppError(502, "Failed to fetch Github emails");
      const rawEmails = await emailRes.json();
      logger.info(rawEmails, "Github Email Details");
      const parsedEmails = GitHubEmailsSchema.parse(rawEmails); //second parse
      logger.info("Before find primary email");
      const primaryEmail = parsedEmails.find((e) => e.primary)?.email ?? null;
      logger.info({ primaryEmail }, "Primary email");
      if (!primaryEmail) {
        throw new AppError(400, "GitHub account must have a primary email");
      }
      logger.info(
        {
          ...parsedUser,
          email: primaryEmail,
        },
        "Successfully logged",
      );
      logger.info("Returning github user");
      return {
        ...parsedUser,
        email: primaryEmail,
        accessToken: tokens.accessToken(),
      };
    } catch (err) {
      if (err instanceof ZodError) throw err;
      if (err instanceof AppError) throw err;
      logger.error(err,"Bad Gateway")
      throw new AppError(502, "Bad Gateway");
    }
  }
}
