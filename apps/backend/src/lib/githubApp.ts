import jwt from "jsonwebtoken";
import { env } from "./env.js";

const GITHUB_API = "https://api.github.com";

export interface InstallationToken {
  token: string;
  expiresAt: string;
}

export interface InstallationRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  cloneUrl: string;
  updatedAt: string;
}

export function createAppJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iat: now - 60, exp: now + 9 * 60, iss: env.GITHUB_APP_CLIENT_ID },
    env.GITHUB_APP_PRIVATE_KEY,
    { algorithm: "RS256" }
  );
}

export async function createInstallationToken(
  installationId: number
): Promise<InstallationToken> {
  const res = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${createAppJwt()}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { token: string; expires_at: string };
  return { token: data.token, expiresAt: data.expires_at };
}

export async function listInstallationRepositories(
  installationId: number
): Promise<InstallationRepo[]> {
  const { token } = await createInstallationToken(installationId);
  const res = await fetch(
    `${GITHUB_API}/installation/repositories?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub repo listing failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    repositories: Array<{
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      default_branch: string;
      clone_url: string;
      updated_at: string;
    }>;
  };

  return data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
    cloneUrl: repo.clone_url,
    updatedAt: repo.updated_at,
  }));
}

export function buildCloneUrl(cloneUrl: string, token: string): string {
  return cloneUrl.replace("https://", `https://x-access-token:${token}@`);
}
