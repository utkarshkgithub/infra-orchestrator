/**
 * ProjectCard — grid card for the dashboard project list.
 * Shows: preview thumbnail, project name, repo, latest deployment status + commit.
 */

import { Link } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge";
import { IconGithub, IconGitCommit, IconImage } from "../ui/icons";
import type { ProjectWithDeployment } from "../../lib/types";
import { formatRelativeTime, getDeployedUrl, repoDisplayName } from "../../lib/utils";

export function ProjectCard({ project }: { project: ProjectWithDeployment }) {
  const dep = project.latestDeployment;
  const deployedUrl = getDeployedUrl(project.publicId);

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl no-underline text-black dark:text-d-fg bg-white dark:bg-d-bg overflow-hidden transition-all duration-200 hover:border-neutral-300 dark:hover:border-d-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:-translate-y-px"
    >
      {/* Preview thumbnail */}
      <div className="w-full h-[130px] bg-neutral-100 dark:bg-d-100 overflow-hidden flex items-center justify-center border-b border-neutral-100 dark:border-d-100 relative">
        {project.previewUrl ? (
          <img
            src={project.previewUrl}
            alt={`${project.name} preview`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-neutral-300 dark:text-d-300">
            <IconImage size={24} />
            <span className="text-[11px]">No preview</span>
          </div>
        )}
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" aria-hidden />
      </div>

      {/* Card body */}
      <div className="flex flex-col px-4 pt-3.5 pb-4 gap-2">
        {/* Name + framework badge */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[14px] font-semibold text-black dark:text-d-fg truncate leading-snug">
            {project.name}
          </span>
          {project.framework && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-d-400 bg-neutral-100 dark:bg-d-100 px-1.5 py-0.5 rounded-md">
              {project.framework}
            </span>
          )}
        </div>

        {/* Repo */}
        <div className="flex items-center gap-1.5 text-[12px] text-neutral-500 dark:text-d-500">
          <IconGithub size={11} className="shrink-0" />
          <span className="truncate">{repoDisplayName(project.repoUrl)}</span>
        </div>

        {/* Deployed URL (only when live) */}
        {dep?.status === "success" && (
          <span className="text-[11px] text-neutral-400 dark:text-d-400 truncate">
            {deployedUrl.replace("https://", "")}
          </span>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 mt-1 pt-3 border-t border-neutral-100 dark:border-d-100">
          {dep ? (
            <>
              <StatusBadge status={dep.status} />
              {dep.commitHash && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 dark:text-d-400">
                  <IconGitCommit size={10} />
                  {dep.commitHash.slice(0, 7)}
                </span>
              )}
              <span className="text-[11px] text-neutral-400 dark:text-d-400 ml-auto">
                {formatRelativeTime(dep.createdAt)}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-neutral-400 dark:text-d-400 ml-auto">
              {formatRelativeTime(project.createdAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Skeleton placeholder for the loading state */
export function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden bg-white dark:bg-d-bg">
      <div className="w-full h-[130px] bg-neutral-100 dark:bg-d-100 animate-pulse" />
      <div className="flex flex-col px-4 pt-3.5 pb-4 gap-2">
        <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-d-200 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-d-100 animate-pulse" />
        <div className="flex items-center mt-1 pt-3 border-t border-neutral-100 dark:border-d-100 gap-2">
          <div className="h-4 w-14 rounded-full bg-neutral-200 dark:bg-d-200 animate-pulse" />
          <div className="h-3 w-10 rounded bg-neutral-100 dark:bg-d-100 animate-pulse ml-auto" />
        </div>
      </div>
    </div>
  );
}
