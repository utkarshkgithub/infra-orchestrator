/**
 * DeploymentsListPage — all user deployments across all projects.
 * Cleaner layout with filtering and better row design.
 */

import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";
import { IconDeploy, IconGitCommit, IconExternalLink } from "../../components/ui/icons";
import { useDeployments, useProjects } from "../../lib/queries";
import { formatDateTime } from "../../lib/utils";

export default function DeploymentsListPage() {
  const deploymentsQuery = useDeployments();
  const projectsQuery = useProjects();

  const deployments = deploymentsQuery.data ?? [];
  const isLoading = deploymentsQuery.isLoading;
  const error = deploymentsQuery.error;

  const projectNames = new Map(
    (projectsQuery.data ?? []).map((p) => [p.id, p.name]),
  );

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-d-fg m-0">
              Deployments
            </h1>
            <p className="text-sm text-neutral-500 dark:text-d-500 mt-1 m-0">
              All builds across your projects
            </p>
          </div>
          {!isLoading && !error && deployments.length > 0 && (
            <span className="text-[12px] text-neutral-400 dark:text-d-400 bg-neutral-100 dark:bg-d-100 px-3 py-1.5 rounded-lg font-medium">
              {deployments.length} deployment{deployments.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-6 h-6 border-2 border-neutral-200 dark:border-d-200 border-t-black dark:border-t-d-fg rounded-full animate-spin-fast" />
            <p className="text-sm text-neutral-500 dark:text-d-500">Loading deployments…</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <ErrorState
            message={error instanceof Error ? error.message : "Failed to load deployments"}
            onRetry={() => void deploymentsQuery.refetch()}
          />
        )}

        {/* Empty */}
        {!isLoading && !error && deployments.length === 0 && (
          <EmptyState
            icon={<IconDeploy size={22} />}
            title="No deployments yet"
            description="Create a project and trigger your first deployment."
            action={{ label: "Create project", to: "/projects/new" }}
          />
        )}

        {/* List */}
        {!isLoading && !error && deployments.length > 0 && (
          <div className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden">
            {deployments.map((dep) => (
              <Link
                key={dep.id}
                to={`/deployments/${dep.id}`}
                className="flex items-center gap-4 px-5 py-4 border-b border-neutral-100 dark:border-d-100 last:border-b-0 no-underline text-inherit transition-colors duration-150 hover:bg-neutral-50/70 dark:hover:bg-d-50"
              >
                {/* Status + ID */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={dep.status} />
                    <span className="text-[13px] font-semibold text-black dark:text-d-fg">
                      #{dep.id}
                    </span>
                    {dep.commitHash && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 dark:text-d-500 bg-neutral-100 dark:bg-d-100 px-1.5 py-0.5 rounded">
                        <IconGitCommit size={10} />
                        {dep.commitHash.slice(0, 7)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-neutral-500 dark:text-d-500">
                    <span className="font-medium">{projectNames.get(dep.projectId) ?? `Project #${dep.projectId}`}</span>
                    <span className="text-neutral-300 dark:text-d-300">·</span>
                    <span>{formatDateTime(dep.createdAt)}</span>
                    {dep.commitMessage && (
                      <>
                        <span className="text-neutral-300 dark:text-d-300">·</span>
                        <span className="truncate max-w-[180px]">{dep.commitMessage}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-center shrink-0">
                  {dep.cdnUrl && (
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium font-sans bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(dep.cdnUrl!, "_blank");
                      }}
                      aria-label="Visit deployed site"
                    >
                      <IconExternalLink size={11} />
                      Visit
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium font-sans bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg">
                    Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
