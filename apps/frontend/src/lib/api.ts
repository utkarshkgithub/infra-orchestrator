import { clearSessionHint } from "./session";
import type {
  Deployment,
  GithubRepo,
  Project,
  ProjectCreateInput,
  ProjectInput,
  UserProfile,
} from "./types";

/**
 * Base URL of the backend.
 *
 * In development this stays empty, so the browser talks to the Vite dev
 * proxy (see vite.config.ts) and never hits a CORS wall. For a production
 * build set VITE_API_URL, otherwise the deployed API is used.
 */
const API_BASE = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "" : "https://api.shipwebsite.tech")
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: { ...headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
    (config.headers as Record<string, string>)["Content-Type"] =
      "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, config);
  } catch (err) {
    const timedOut =
      err instanceof DOMException && err.name === "TimeoutError";
    throw new ApiError(
      timedOut
        ? "The server took too long to answer. Please try again."
        : "Cannot reach the server. Check your connection and try again.",
      0,
    );
  }

  if (res.status === 401) {
    // The session is gone. Tell the app, but do not redirect here:
    // ProtectedRoute owns the redirect so the user keeps their place.
    clearSessionHint();
    window.dispatchEvent(new Event("auth:unauthorized"));
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      errorMessage(errorData, res.status),
      res.status,
    );
  }

  if (res.status === 204) {
    return {} as T;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/**
 * The backend answers errors as { success:false, error, issues? }.
 * `issues` holds the zod validation details, which are much more useful
 * than the flat "Validation Failed" message.
 */
function errorMessage(data: Record<string, unknown>, status: number): string {
  const base =
    (typeof data.error === "string" && data.error) ||
    (typeof data.message === "string" && data.message) ||
    `Request failed with status ${status}`;

  const issues = data.issues;
  if (issues && typeof issues === "object") {
    const details = Object.entries(issues as Record<string, unknown>)
      .map(([field, problem]) => {
        const text = Array.isArray(problem)
          ? problem.join(", ")
          : String(problem);
        return `${field}: ${text}`;
      })
      .join("; ");
    if (details) return `${base} (${details})`;
  }

  return base;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function getGithubAuthUrl(): string {
  return `${API_BASE}/auth/github`;
}

export function getMe() {
  return request<UserProfile>("/auth/me");
}

export function logoutSession() {
  return request<void>("/auth/logout", { method: "POST" });
}

/** Dev only: the backend creates a session for the seeded "dev" user. */
export function devLogin() {
  return request<{ success: boolean }>("/auth/dev-login", { method: "POST" });
}

export function getGithubRepos() {
  return request<GithubRepo[]>("/auth/github/repos");
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function getProjects() {
  return request<Project[]>("/project/");
}

/** Returns null when the project does not exist or belongs to someone else. */
export function getProjectDetails(id: number) {
  return request<Project | null>(`/project/${id}`);
}

export function createProject(data: ProjectCreateInput) {
  return request<Project>("/project/create", {
    method: "POST",
    body: data,
  });
}

export function updateProject(data: ProjectInput) {
  return request<Project>("/project/update", {
    method: "PATCH",
    body: data,
  });
}

// ─── Deployments ─────────────────────────────────────────────────────────────

export function getDeployments() {
  return request<Deployment[]>("/deployment/");
}

/** Returns null when the deployment does not exist or belongs to someone else. */
export function getDeploymentDetails(id: number) {
  return request<Deployment | null>(`/deployment/${id}`);
}

export function createDeployment(projectId: number, commitHash: string) {
  return request<Deployment>("/deployment/create", {
    method: "POST",
    body: { projectId, commitHash },
  });
}

// ─── GitHub ──────────────────────────────────────────────────────────────────

/**
 * Head commit of the default branch of a public repository.
 *
 * Used to prefill the commit field, so the user does not have to look the
 * hash up. Returns an empty string when GitHub cannot be reached, the user
 * then pastes a commit themselves.
 */
export async function getHeadCommit(fullName: string): Promise<string> {
  if (!fullName) return "";
  try {
    const res = await fetch(
      `https://api.github.com/repos/${fullName}/commits?per_page=1`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) return "";
    const commits = await res.json();
    const sha = Array.isArray(commits) ? commits[0]?.sha : undefined;
    return typeof sha === "string" ? sha : "";
  } catch {
    return "";
  }
}
