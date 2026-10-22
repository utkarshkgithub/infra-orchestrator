/**
 * Small helpers shared by the pages.
 * The path helpers exist because the executor rejects absolute paths and
 * empty output dirs (apps/executor/src/services/build.ts).
 */

import type { Project, ProjectInput } from "./types";

/** "app" | "./app" | "/app" -> "app".  "/" and "" -> "". */
export function normalizeRootDir(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^\.?\//, "").replace(/^\/+/, "");
}

/** "./dist" -> "dist". Empty falls back to the backend default "dist". */
export function normalizeOutputDir(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().replace(/^\.?\//, "").replace(/^\/+/, "");
  return normalized || "dist";
}

/** "KEY=VALUE" lines -> object. Lines without "=" are ignored. */
export function parseEnvVars(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    if (!key) continue;
    result[key] = trimmed.slice(index + 1).trim();
  }
  return result;
}

/** Object -> "KEY=VALUE" lines, for the textareas. */
export function formatEnvVars(envVars: Record<string, string> | null): string {
  if (!envVars) return "";
  return Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

/** "https://github.com/owner/repo.git" -> "owner/repo". */
export function repoFullName(repoUrl: string): string {
  try {
    return new URL(repoUrl).pathname.replace(/^\//, "").replace(/\.git$/, "");
  } catch {
    return "";
  }
}

/** "https://github.com/owner/repo.git" -> "owner/repo". */
export function repoDisplayName(repoUrl: string): string {
  return repoFullName(repoUrl) || repoUrl;
}

/** Domain the deployed sites are served from. */
const DEPLOY_DOMAIN =
  import.meta.env.VITE_DEPLOY_DOMAIN ?? "deploy.shipwebsite.tech";

export function getDeployedUrl(publicId: string): string {
  return `https://${publicId}.${DEPLOY_DOMAIN}`;
}

/**
 * A git commit hash: 7 to 40 hex characters (a short or a full sha).
 * The backend checks that the commit really exists before it queues a job.
 */
export function isValidCommitHash(value: string): boolean {
  return /^[0-9a-f]{7,40}$/i.test(value.trim());
}

/**
 * The create/update project schemas require an `environments` array (name,
 * branch, isProduction). The update service drops it, so on PATCH it exists
 * only to pass validation — the branch given is used on create.
 */
export function environmentsPayload(defaultBranch?: string) {
  return [
    {
      name: "production",
      branch: defaultBranch || "main",
      isProduction: true,
    },
  ];
}

/**
 * Builds the body the backend expects when a project is updated.
 * The update schema requires the id and every other field, including
 * githubRepoId, so the whole project is sent back.
 */
export function projectPayload(
  project: Project,
  overrides: Partial<ProjectInput> = {},
): ProjectInput {
  return {
    id: project.id,
    githubRepoId: project.githubRepoId,
    name: project.name,
    repoUrl: project.repoUrl,
    rootDir: normalizeRootDir(project.rootDir),
    installCmd: project.installCmd,
    buildCmd: project.buildCmd,
    outputDir: normalizeOutputDir(project.outputDir),
    framework: project.framework,
    envVars: project.envVars ?? {},
    environments: environmentsPayload(),
    ...overrides,
  };
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
