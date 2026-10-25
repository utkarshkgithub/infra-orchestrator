import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { AppError } from "../middleware/error.middleware.js";
import { logger } from "./logger.js";

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
    logger.error(res.status,'GitHub repo listing failed:');
    throw new AppError(500,`GitHub repo listing failed`);
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

export interface InstalledRepo extends InstallationRepo {
  installationId: number;
}

// shortcut: scans every installation (2 API calls each) — fine at small
// scale, upgrade to stored installation ids if the app ever has many.
export async function listInstalledRepos(): Promise<InstalledRepo[]> {
  const res = await fetch(`${GITHUB_API}/app/installations?per_page=100`, {
    headers: {
      Authorization: `Bearer ${createAppJwt()}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    logger.error(res.status,`GitHub installations request failed`);
    throw new AppError(500,`GitHub installations request failed`);
  }
  // GET /app/installations returns a bare array (no wrapper object).
  const installations = (await res.json()) as Array<{ id: number }>;
  const perInstallation = await Promise.all(
    installations.map(async (installation) =>
      (await listInstallationRepositories(installation.id)).map((repo) => ({
        ...repo,
        installationId: installation.id,
      })),
    ),
  );
  return perInstallation.flat();
}

// Resolves the installation covering the repo and mints a clone token.
// Returns null only when the app is not installed on the repo;
export async function findRepoInstallationToken(
  githubRepoId: number
): Promise<string | null> {
  const repos = await listInstalledRepos();
  const installationId = repos.find((repo) => repo.id === githubRepoId)
    ?.installationId;
  if (installationId === undefined) return null;
  return (await createInstallationToken(installationId)).token;
}

// Head commit SHA of a repo's default branch, resolved with the app
// installation token so private repos work and the browser never calls
// api.github.com directly (it 404s private repos and shares 60 req/hour).
export async function getRepoHeadCommit(
  fullName: string
): Promise<string | null> {
  const repos = await listInstalledRepos();
  const installationId = repos.find((repo) => repo.fullName === fullName)
    ?.installationId;
  if (installationId === undefined) return null;
  const { token } = await createInstallationToken(installationId);
  const res = await fetch(`${GITHUB_API}/repos/${fullName}/commits?per_page=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return null;
  const commits = (await res.json()) as Array<{ sha?: string }>;
  return Array.isArray(commits) ? (commits[0]?.sha ?? null) : null;
}
