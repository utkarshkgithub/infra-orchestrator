import { clearSessionHint } from "./session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  redirectOnUnauthorized?: boolean;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    redirectOnUnauthorized = true,
  } = options;

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
    (config.headers as Record<string, string>)["Content-Type"] =
      "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 401) {
    clearSessionHint();
    if (redirectOnUnauthorized && window.location.pathname !== "/") {
      window.location.href = "/";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      errorData.error ||
        errorData.message ||
        `Request failed with status ${res.status}`,
      res.status,
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────
export function getGithubAuthUrl(): string {
  return `${API_BASE}/auth/github`;
}

export function checkHealth() {
  return request<{ status: string; env?: string }>("/health");
}

export function checkAuthHealth() {
  return request<{ status: string; env: string }>("/auth/health", {
    redirectOnUnauthorized: false,
  });
}

export function logoutSession() {
  return request<void>("/auth/logout", {
    method: "POST",
  });
}

// ─── User ────────────────────────────────────────────────
export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  login: string;
  avatarUrl: string;
}

export function getMe() {
  return request<UserProfile>("/auth/me", {
    redirectOnUnauthorized: false,
  });
}

// ─── Projects ────────────────────────────────────────────
export interface Project {
  id: number;
  publicId: string;
  userId: number;
  name: string;
  repoUrl: string;
  createdAt: string;
  rootDir: string;
  installCmd: string;
  buildCmd: string;
  framework: string | null;
  outputDir: string;
  envVars: Record<string, string>;
  previewUrl: string | null;
}

export function getProjects() {
  return request<Project[]>("/project/");
}

export function getProjectDetails(id: number) {
  return request<Project>(`/project/${id}`);
}

export function createProject(data: { name: string; repoUrl: string }) {
  return request<Project>("/project/create", {
    method: "POST",
    body: data,
  });
}

export function updateProject(
  data: Partial<Project> & { name: string; repoUrl: string },
) {
  return request<Project>("/project/update", {
    method: "PATCH",
    body: data,
  });
}

// ─── Deployments ─────────────────────────────────────────
export interface Deployment {
  id: number;
  publicId: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "building" | "success" | "failed" | "cancelled";
  projectId: number;
  logs: string | null;
  commitHash: string | null;
  cdnUrl: string | null;
  artifactPath: string | null;
}

export function getDeployments() {
  return request<Deployment[]>("/deployment/");
}

export function getProjectDeployments(projectId: number) {
  return getDeployments().then((deployments) =>
    deployments.filter((deployment) => deployment.projectId === projectId),
  );
}

export function getDeploymentDetails(id: number) {
  return request<Deployment>(`/deployment/${id}`);
}

export function createDeployment(projectId: number) {
  return request<Deployment>("/deployment/create", {
    method: "POST",
    body: { projectId },
  });
}

// ─── Aggregated Queries ──────────────────────────────────
export interface ProjectWithDeployment extends Project {
  latestDeployment?: Deployment;
}

export interface DashboardData {
  projects: ProjectWithDeployment[];
  allDeployments: Deployment[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [projects, deployments] = await Promise.all([
    getProjects(),
    getDeployments(),
  ]);

  // Group deployments by projectId, sorted by createdAt desc
  const deploymentsByProject = new Map<number, Deployment>();
  const sorted = [...deployments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  for (const dep of sorted) {
    if (!deploymentsByProject.has(dep.projectId)) {
      deploymentsByProject.set(dep.projectId, dep);
    }
  }

  const projectsWithDeployments = projects.map((project) => ({
    ...project,
    latestDeployment: deploymentsByProject.get(project.id),
  }));

  return { projects: projectsWithDeployments, allDeployments: deployments };
}

// ─── URL Helpers ─────────────────────────────────────────
export function getDeployedUrl(publicId: string): string {
  return `https://${publicId}.deploy.shipwebsite.tech`;
}

// ─── GET USER REPOS ─────────────────────────────────────────
export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  updated_at: string;
}

export function getGithubRepos() {
  return request<GithubRepo[]>("/github/repos");
}