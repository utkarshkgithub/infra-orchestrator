import { useQuery } from "@tanstack/react-query";
import {
  getDeploymentDetails,
  getDeployments,
  getGithubRepos,
  getProjectDetails,
  getProjects,
} from "./api";
import type { Deployment } from "./types";

/** Deployments in these states are still moving, so the UI keeps polling. */
function isActive(status: Deployment["status"]): boolean {
  return status === "pending" || status === "building";
}

const POLL_INTERVAL_MS = 10_000;

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    staleTime: 30_000,
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectDetails(id),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
  });
}

/**
 * One request for every deployment of the user, shared by the dashboard,
 * the project page and the deployments list (react-query dedupes by key).
 * It polls only while something is still building.
 */
export function useDeployments() {
  return useQuery({
    queryKey: ["deployments"],
    queryFn: getDeployments,
    staleTime: 10_000,
    refetchInterval: (query) => {
      const deployments = query.state.data as Deployment[] | undefined;
      return deployments?.some((deployment) => isActive(deployment.status))
        ? POLL_INTERVAL_MS
        : false;
    },
  });
}

/** Same request as useDeployments, filtered to one project in the browser. */
export function useProjectDeployments(projectId: number) {
  return useQuery({
    queryKey: ["deployments"],
    queryFn: getDeployments,
    staleTime: 10_000,
    select: (deployments) =>
      deployments.filter((deployment) => deployment.projectId === projectId),
    refetchInterval: (query) => {
      const deployments = query.state.data as Deployment[] | undefined;
      return deployments?.some((deployment) => isActive(deployment.status))
        ? POLL_INTERVAL_MS
        : false;
    },
  });
}

export function useDeployment(id: number) {
  return useQuery({
    queryKey: ["deployment", id],
    queryFn: () => getDeploymentDetails(id),
    enabled: Number.isFinite(id),
    staleTime: 5_000,
    refetchInterval: (query) => {
      const deployment = query.state.data as Deployment | null | undefined;
      return deployment && isActive(deployment.status)
        ? POLL_INTERVAL_MS
        : false;
    },
  });
}

export function useGithubRepos() {
  return useQuery({
    queryKey: ["github-repos"],
    queryFn: getGithubRepos,
    staleTime: 60_000,
  });
}

/** Newest deployment per project id. */
export function groupLatestByProject(
  deployments: Deployment[],
): Map<number, Deployment> {
  const latest = new Map<number, Deployment>();
  const sorted = [...deployments].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  for (const deployment of sorted) {
    if (!latest.has(deployment.projectId)) {
      latest.set(deployment.projectId, deployment);
    }
  }
  return latest;
}
