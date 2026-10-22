/**
 * Shapes returned by the backend (apps/backend).
 * Keep in sync with:
 *  - apps/backend/prisma/schema.prisma
 *  - apps/backend/src/modules/projects/projects.types.ts
 *  - apps/backend/src/modules/deployments/deployments.types.ts
 */

export type DeploymentStatus =
  | "pending"
  | "building"
  | "success"
  | "failed"
  | "cancelled";

export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  login: string;
  avatarUrl: string;
}

/** A row of the `Project` table. `githubRepoId` is the GitHub repository id. */
export interface Project {
  id: number;
  publicId: string;
  userId: number;
  githubRepoId: number;
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

/** A row of the `Deployment` table. There is no `publicId` on a deployment. */
export interface Deployment {
  id: number;
  createdAt: string;
  updatedAt: string;
  status: DeploymentStatus;
  projectId: number;
  logs: string | null;
  cdnUrl: string | null;
  artifactPath: string | null;
  commitHash: string;
  commitMessage: string | null;
  commitAuthorName: string | null;
  commitAuthorEmail: string | null;
  commitAuthorUsername: string | null;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  updated_at: string;
}

/** A project plus its newest deployment, for the dashboard. */
export interface ProjectWithDeployment extends Project {
  latestDeployment?: Deployment;
}

/** What the backend expects for `POST /project/create` and `PATCH /project/update`. */
export interface ProjectInput {
  id: number;
  userId?: number;
  githubRepoId: number;
  name: string;
  repoUrl: string;
  rootDir: string;
  installCmd: string;
  buildCmd: string;
  outputDir: string;
  framework: string | null;
  envVars: Record<string, string>;
}

/**
 * Create has no id: the backend validates it with a schema without an id and
 * the database assigns one. Update needs the id of the project to change.
 */
export type ProjectCreateInput = Omit<ProjectInput, "id">;
