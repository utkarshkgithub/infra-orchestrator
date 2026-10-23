/**
 * ActivityFeed — recent deployments sidebar panel on the dashboard.
 */

import { Link } from "react-router-dom";
import { StatusDot } from "../ui/StatusBadge";
import { IconClock } from "../ui/icons";
import type { Deployment, ProjectWithDeployment } from "../../lib/types";
import { formatRelativeTime } from "../../lib/utils";

interface ActivityFeedProps {
  deployments: Deployment[];
  projectMap: Map<number, ProjectWithDeployment>;
}

export function ActivityFeed({ deployments, projectMap }: ActivityFeedProps) {
  return (
    <aside className="flex flex-col gap-3">
      <div className="border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-d-100">
          <h3 className="text-[11px] font-semibold text-neutral-500 dark:text-d-500 uppercase tracking-widest m-0">
            Recent Activity
          </h3>
        </div>

        {deployments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center text-neutral-400 dark:text-d-400">
            <IconClock size={22} />
            <p className="text-[12px] m-0">No deployments yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {deployments.map((dep) => {
              const proj = projectMap.get(dep.projectId);
              return (
                <Link
                  key={dep.id}
                  to={`/deployments/${dep.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 no-underline text-inherit transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 border-b border-neutral-50 dark:border-d-100 last:border-0"
                >
                  <StatusDot status={dep.status} />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[12px] font-medium text-black dark:text-d-fg truncate">
                      {proj?.name ?? `Project #${dep.projectId}`}
                    </span>
                    <span className="block text-[11px] text-neutral-400 dark:text-d-400">
                      {formatRelativeTime(dep.createdAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
