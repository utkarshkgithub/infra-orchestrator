/**
 * ProjectDetailPage — was 820 lines. Now ~130 lines.
 * All sub-panels extracted into dedicated components.
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AppShell from "../../components/layout/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import { DeployCard } from "../../components/project/DeployCard";
import { DeploymentsTab } from "../../components/project/DeploymentsTab";
import { SettingsTab } from "../../components/project/SettingsTab";
import { ErrorState } from "../../components/ui/EmptyState";
import { CopyButton } from "../../components/ui/CopyButton";

import { IconGithub, IconExternalLink } from "../../components/ui/icons";
import { useProject, useProjectDeployments } from "../../lib/queries";
import type { Deployment } from "../../lib/types";
import { getDeployedUrl, repoDisplayName } from "../../lib/utils";

type Tab = "deployments" | "settings";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("deployments");

  const projectQuery = useProject(projectId);
  const deploymentsQuery = useProjectDeployments(projectId);

  const project = projectQuery.data;
  const deployments = deploymentsQuery.data ?? [];
  const loading = projectQuery.isLoading || deploymentsQuery.isLoading;
  const error = projectQuery.error || deploymentsQuery.error;

  const handleDeployed = (dep: Deployment) => {
    queryClient.setQueryData<Deployment[]>(["deployments"], (prev = []) => [dep, ...prev]);
  };

  if (loading) return <ProjectDetailSkeleton />;

  if (error || !project) {
    return (
      <AppShell>
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <ErrorState
            message={error instanceof Error ? error.message : "Project not found"}
            onRetry={() => { void projectQuery.refetch(); }}
          />
          <div className="flex justify-center mt-4">
            <Link to="/projects" className="text-sm text-neutral-500 hover:text-black dark:hover:text-d-fg no-underline transition-colors">
              ← Back to Projects
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const deployedUrl = getDeployedUrl(project.publicId);
  const hasLive = deployments.some((d) => d.status === "success");

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] mb-5" aria-label="breadcrumb">
          <Link to="/projects" className="text-neutral-500 dark:text-d-500 no-underline hover:text-black dark:hover:text-d-fg transition-colors">Projects</Link>
          <span className="text-neutral-300 dark:text-d-300">/</span>
          <span className="text-black dark:text-d-fg font-medium">{project.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-d-fg m-0">
              {project.name}
            </h1>
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-d-500 no-underline hover:text-black dark:hover:text-d-fg transition-colors"
            >
              <IconGithub size={13} />
              {repoDisplayName(project.repoUrl)}
            </a>
          </div>

          {/* Live URL chip */}
          {hasLive && (
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-d-50 border border-neutral-200 dark:border-d-200 rounded-xl">
              <StatusBadge status="success" />
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-black dark:text-d-fg no-underline hover:underline truncate max-w-[240px]"
              >
                {deployedUrl.replace("https://", "")}
              </a>
              <CopyButton text={deployedUrl} />
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 dark:text-d-400 hover:text-black dark:hover:text-d-fg hover:bg-neutral-100 dark:hover:bg-d-100 transition-colors"
                aria-label="Visit site"
              >
                <IconExternalLink size={13} />
              </a>
            </div>
          )}
        </div>

        {/* Deploy Card */}
        <div className="mb-6">
          <DeployCard project={project} onDeployed={handleDeployed} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-d-200 mb-6">
          {(["deployments", "settings"] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={[
                "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 capitalize transition-all duration-150",
                activeTab === tab
                  ? "text-black dark:text-d-fg border-b-black dark:border-b-d-fg font-semibold"
                  : "text-neutral-500 dark:text-d-500 border-b-transparent hover:text-black dark:hover:text-d-fg",
              ].join(" ")}
              onClick={() => setActiveTab(tab)}
              aria-selected={activeTab === tab}
            >
              {tab}
              {tab === "deployments" && deployments.length > 0 && (
                <span className="text-[10px] bg-neutral-100 dark:bg-d-100 text-neutral-500 dark:text-d-500 px-1.5 py-px rounded-full font-medium">
                  {deployments.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "deployments" && (
          <DeploymentsTab deployments={deployments} project={project} />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            project={project}
            onUpdate={(updated) => {
              queryClient.setQueryData(["project", projectId], updated);
              queryClient.invalidateQueries({ queryKey: ["projects"] });
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProjectDetailSkeleton() {
  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex items-center gap-1.5 mb-5">
          <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-d-200 animate-pulse" />
          <span className="text-neutral-300 dark:text-d-300">/</span>
          <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-d-200 animate-pulse" />
        </div>
        <div className="h-8 w-48 rounded-lg bg-neutral-200 dark:bg-d-200 animate-pulse mb-2" />
        <div className="h-4 w-36 rounded bg-neutral-100 dark:bg-d-100 animate-pulse mb-6" />
        <div className="h-20 rounded-xl bg-neutral-100 dark:bg-d-100 animate-pulse mb-6" />
        <div className="h-5 w-64 rounded bg-neutral-100 dark:bg-d-100 animate-pulse mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-d-100 last:border-b-0">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="h-5 w-14 rounded-full bg-neutral-200 dark:bg-d-200 animate-pulse" />
                <div className="h-4 w-10 rounded bg-neutral-200 dark:bg-d-200 animate-pulse" />
              </div>
              <div className="h-3 w-40 rounded bg-neutral-100 dark:bg-d-100 animate-pulse" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-neutral-200 dark:bg-d-200 animate-pulse" />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
