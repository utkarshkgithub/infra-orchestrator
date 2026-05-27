import { generateState, OAuth2RequestError } from "arctic";
import { githubProvider } from "./github.provider.js";
import { GitHubEmail, GitHubUser } from "./github.types.js";
import { AppError } from "../../middleware/error.middleware.js";
import { logger } from "../../lib/logger.js";

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
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!userRes.ok) throw new Error("Failed to fetch GitHub user");
      const rawUser = (await userRes.json()) as Partial<GitHubUser>;

      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (!emailRes.ok) throw new Error("Failed to fetch GitHub emails");
      const emails = (await emailRes.json()) as GitHubEmail[];
      const primaryEmail = emails.find((e) => e.primary)?.email ?? null;

      logger.info(
        {
          id: rawUser.id!,
          login: rawUser.login!,
          email: primaryEmail!,
          avatar_url: rawUser.avatar_url!,
        },
        "Successfully logged",
      );

      return {
        id: rawUser.id!,
        login: rawUser.login!,
        email: primaryEmail!,
        avatar_url: rawUser.avatar_url!,
      };
    } catch (err) {
      
      throw new AppError(500,"Failed to authenticate with GitHub")
    }
  }
}
