/**
 * ProjectListItem — compact row item for list-view mode on the dashboard.
 */

import { Link } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge";
import { IconGithub } from "../ui/icons";
import type { ProjectWithDeployment } from "../../lib/types";
import { formatRelativeTime, repoDisplayName } from "../../lib/utils";

export function ProjectListItem({ project }: { project: ProjectWithDeployment }) {
  const dep = project.latestDeployment;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex items-center px-5 py-3.5 no-underline text-inherit border-b border-neutral-100 dark:border-d-100 last:border-b-0 transition-colors duration-150 hover:bg-neutral-50/70 dark:hover:bg-d-50 group"
    >
      {/* Icon */}
      <div className="w-7 h-7 rounded-md bg-black dark:bg-d-fg text-white dark:text-d-bg flex items-center justify-center shrink-0 text-[12px] font-bold mr-3">
        {project.framework ? project.framework.charAt(0).toUpperCase() : "S"}
      </div>

      {/* Name + Repo */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[13px] font-semibold text-black dark:text-d-fg truncate">
          {project.name}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-d-500 truncate">
          <IconGithub size={10} className="shrink-0" />
          {repoDisplayName(project.repoUrl)}
        </span>
      </div>

      {/* Status */}
      <div className="shrink-0 mx-4">
        {dep && <StatusBadge status={dep.status} />}
      </div>

      {/* Time */}
      <div className="shrink-0">
        <span className="text-[12px] text-neutral-400 dark:text-d-400">
          {dep
            ? formatRelativeTime(dep.createdAt)
            : formatRelativeTime(project.createdAt)}
        </span>
      </div>
    </Link>
  );
}
