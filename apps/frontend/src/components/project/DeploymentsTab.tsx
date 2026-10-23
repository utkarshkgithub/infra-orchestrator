/**
 * DeploymentsTab — list of all deployments for a project.
 * Extracted from the 820-line ProjectDetailPage.
 */

import { Link } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge";
import { EmptyState } from "../ui/EmptyState";
import { IconDeploy, IconExternalLink, IconGitCommit } from "../ui/icons";
import type { Deployment, Project } from "../../lib/types";
import { formatDateTime } from "../../lib/utils";

interface DeploymentsTabProps {
  deployments: Deployment[];
  project: Project;
}

export function DeploymentsTab({ deployments, project }: DeploymentsTabProps) {
  if (deployments.length === 0) {
    return (
      <EmptyState
        icon={<IconDeploy size={22} />}
        title="No deployments yet"
        description='Click "Deploy" above to trigger your first build.'
      />
    );
  }

  return (
    <div className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden">
      {deployments.map((dep) => (
        <div
          key={dep.id}
          className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-d-100 last:border-b-0 transition-colors duration-150 hover:bg-neutral-50/60 dark:hover:bg-d-50 gap-4"
        >
          {/* Left — status + meta */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={dep.status} />
              <span className="text-sm font-semibold text-black dark:text-d-fg">
                #{dep.id}
              </span>
              {dep.commitHash && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 dark:text-d-500 bg-neutral-100 dark:bg-d-100 px-1.5 py-0.5 rounded">
                  <IconGitCommit size={10} />
                  {dep.commitHash.slice(0, 7)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-neutral-500 dark:text-d-500 flex-wrap">
              <span>{project.name}</span>
              <span className="text-neutral-300 dark:text-d-300">·</span>
              <span>{formatDateTime(dep.createdAt)}</span>
              {dep.commitMessage && (
                <>
                  <span className="text-neutral-300 dark:text-d-300">·</span>
                  <span className="truncate max-w-[200px]" title={dep.commitMessage}>
                    {dep.commitMessage}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex gap-2 items-center shrink-0">
            {dep.cdnUrl && (
              <a
                href={dep.cdnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium font-sans bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg no-underline transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg"
              >
                <IconExternalLink size={11} />
                Visit
              </a>
            )}
            <Link
              to={`/deployments/${dep.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium font-sans bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg no-underline transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg"
            >
              Details →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
