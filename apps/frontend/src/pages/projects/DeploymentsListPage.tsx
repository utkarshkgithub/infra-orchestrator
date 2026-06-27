import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getDeployments, type Deployment } from "../../lib/api";

export default function DeploymentsListPage() {
  const {
    data: deployments = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["deployments"],
    queryFn: getDeployments,
    staleTime: 15_000,
  });

  return (
    <DashboardLayout>
      <div className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-d-fg m-0">
              Deployments
            </h1>
            <p className="text-sm text-neutral-500 dark:text-d-500 mt-1 m-0">
              All deployments across your projects
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-neutral-200 dark:border-d-200 border-t-black dark:border-t-d-fg rounded-full animate-spin-fast" />
            <p className="text-sm text-neutral-500 dark:text-d-500">
              Loading deployments…
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-lg">
              !
            </div>
            <p className="text-sm text-neutral-500 dark:text-d-500">
              {error instanceof Error
                ? error.message
                : "Failed to load deployments"}
            </p>
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && deployments.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 border border-dashed border-neutral-200 dark:border-d-200 rounded-xl gap-2">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-300 dark:text-d-300"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <h3 className="text-base font-semibold m-0 mt-2 text-black dark:text-d-fg">
              No deployments yet
            </h3>
            <p className="text-sm text-neutral-500 dark:text-d-500 m-0 mb-4">
              Create a project and trigger your first deployment.
            </p>
            <Link to="/projects/new" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent rounded-lg no-underline cursor-pointer transition-all duration-150 hover:opacity-85">
              Create Project
            </Link>
          </div>
        )}

        {!isLoading && !error && deployments.length > 0 && (
          <div className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden">
            {deployments.map((dep) => (
              <Link
                key={dep.id}
                to={`/deployments/${dep.id}`}
                className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-d-100 last:border-b-0 no-underline text-inherit transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-d-50"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={dep.status} />
                    <span className="text-sm font-semibold text-black dark:text-d-fg">
                      #{dep.id}
                    </span>
                    <span className="text-[12px] font-mono text-neutral-400 dark:text-d-400">
                      {dep.publicId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="text-[13px] text-neutral-500 dark:text-d-500 flex items-center gap-1">
                    <span>Project #{dep.projectId}</span>
                    <span className="text-neutral-300 dark:text-d-300">·</span>
                    <span>{formatDateTime(dep.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  {dep.cdnUrl && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium font-sans bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(dep.cdnUrl!, "_blank");
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Visit
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium font-sans bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg">Details →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: Deployment["status"] }) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide whitespace-nowrap";
  const config: Record<string, { label: string; colors: string }> = {
    pending: { label: "Pending", colors: "bg-amber-500/10 text-amber-600" },
    building: { label: "Building", colors: "bg-blue-500/10 text-blue-600" },
    success: { label: "Ready", colors: "bg-green-500/10 text-green-600" },
    failed: { label: "Failed", colors: "bg-red-500/10 text-red-600" },
    cancelled: { label: "Cancelled", colors: "bg-neutral-500/10 text-neutral-500" },
  };
  const c = config[status] || config.pending;
  return <span className={`${base} ${c.colors}`}>{c.label}</span>;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
