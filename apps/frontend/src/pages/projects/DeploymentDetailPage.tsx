/**
 * DeploymentDetailPage — deployment status + logs view.
 * Improved: copy logs button, line numbering, real-time polling indicator,
 * commit metadata displayed prominently.
 */

import { Link, useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import { CopyButton } from "../../components/ui/CopyButton";
import { ErrorState } from "../../components/ui/EmptyState";
import { IconGitCommit, IconExternalLink } from "../../components/ui/icons";
import { useDeployment, useProject } from "../../lib/queries";
import { formatDateTime, getDeployedUrl } from "../../lib/utils";

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 p-3.5 border border-neutral-200 dark:border-d-200 rounded-xl bg-white dark:bg-d-bg">
      <span className="text-[10px] text-neutral-400 dark:text-d-400 uppercase tracking-widest font-semibold">
        {label}
      </span>
      <span className={`text-sm font-medium text-black dark:text-d-fg break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export default function DeploymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deploymentId = Number(id);

  const deploymentQuery = useDeployment(deploymentId);
  const deployment = deploymentQuery.data;
  const projectQuery = useProject(deployment?.projectId ?? NaN);

  if (deploymentQuery.isLoading) {
    return (
      <AppShell>
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-6 h-6 border-2 border-neutral-200 dark:border-d-200 border-t-black dark:border-t-d-fg rounded-full animate-spin-fast" />
            <p className="text-sm text-neutral-500 dark:text-d-500">Loading deployment…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const error = deploymentQuery.error;

  if (error || !deployment) {
    return (
      <AppShell>
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <ErrorState
            message={error instanceof Error ? error.message : "Deployment not found"}
            onRetry={() => void deploymentQuery.refetch()}
          />
        </div>
      </AppShell>
    );
  }

  const project = projectQuery.data;
  const liveUrl = project ? getDeployedUrl(project.publicId) : null;
  const isActive = deployment.status === "pending" || deployment.status === "building";

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] mb-5 flex-wrap" aria-label="breadcrumb">
          <Link to="/projects" className="text-neutral-500 dark:text-d-500 no-underline hover:text-black dark:hover:text-d-fg transition-colors">
            Projects
          </Link>
          <span className="text-neutral-300 dark:text-d-300">/</span>
          <Link
            to={`/projects/${deployment.projectId}`}
            className="text-neutral-500 dark:text-d-500 no-underline hover:text-black dark:hover:text-d-fg transition-colors"
          >
            {project?.name ?? `Project #${deployment.projectId}`}
          </Link>
          <span className="text-neutral-300 dark:text-d-300">/</span>
          <span className="text-black dark:text-d-fg font-medium">
            Deployment #{deployment.id}
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-d-fg m-0">
              Deployment #{deployment.id}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-d-500 mt-1 m-0 flex items-center gap-2 flex-wrap">
              <StatusBadge status={deployment.status} />
              <span>Created {formatDateTime(deployment.createdAt)}</span>
              {isActive && (
                <span className="text-[11px] text-neutral-400 dark:text-d-400 animate-pulse">
                  — polling for updates…
                </span>
              )}
            </p>
          </div>
          {liveUrl && deployment.status === "success" && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent rounded-lg no-underline transition-all duration-150 hover:opacity-85"
            >
              <IconExternalLink size={14} />
              Visit Site
            </a>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mb-6">
          <InfoCard label="Status" value={deployment.status.toUpperCase()} />
          <InfoCard label="Created" value={formatDateTime(deployment.createdAt)} />
          <InfoCard label="Updated" value={formatDateTime(deployment.updatedAt)} />
          <InfoCard label="Commit" value={deployment.commitHash.slice(0, 8)} mono />
          {liveUrl && <InfoCard label="Live URL" value={liveUrl} mono />}
          {deployment.commitAuthorName && (
            <InfoCard label="Author" value={deployment.commitAuthorName} />
          )}
        </div>

        {/* Commit message */}
        {deployment.commitMessage && (
          <div className="mb-6 p-4 border border-neutral-200 dark:border-d-200 rounded-xl bg-white dark:bg-d-bg">
            <div className="flex items-center gap-2 mb-2">
              <IconGitCommit size={13} className="text-neutral-400 dark:text-d-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-d-400">
                Commit message
              </span>
              {deployment.commitAuthorUsername && (
                <span className="text-[11px] text-neutral-400 dark:text-d-400">
                  by @{deployment.commitAuthorUsername}
                </span>
              )}
            </div>
            <p className="text-[13px] text-neutral-700 dark:text-d-700 m-0 break-words leading-relaxed">
              {deployment.commitMessage}
            </p>
          </div>
        )}

        {/* Build in progress */}
        {isActive && (
          <div className="flex flex-col items-center gap-3 py-12 border border-neutral-200 dark:border-d-200 rounded-xl text-center mb-6">
            <div className="flex gap-1.5">
              {[0, 200, 400].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-blue-500 animate-building-pulse"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <p className="text-sm font-semibold m-0 text-black dark:text-d-fg">
              {deployment.status === "pending" ? "Waiting for build worker…" : "Build in progress…"}
            </p>
            <span className="text-[12px] text-neutral-400 dark:text-d-400">
              This page auto-refreshes.
            </span>
          </div>
        )}

        {/* Build logs */}
        {deployment.logs && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold m-0 text-black dark:text-d-fg">
                Build Logs
              </h3>
              <CopyButton text={deployment.logs} />
            </div>
            <pre className="bg-[#0d1117] text-[#e6edf3] px-5 py-4 rounded-xl font-mono text-[11.5px] leading-[1.75] overflow-x-auto whitespace-pre-wrap break-words max-h-[560px] overflow-y-auto border border-neutral-800/30 dark:border-d-200 scrollbar-thin">
              {deployment.logs.split("\n").map((line, i) => (
                <span key={i} className="flex gap-3">
                  <span className="select-none text-neutral-600 text-right shrink-0 w-7 inline-block">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </span>
              ))}
            </pre>
          </div>
        )}
      </div>
    </AppShell>
  );
}
