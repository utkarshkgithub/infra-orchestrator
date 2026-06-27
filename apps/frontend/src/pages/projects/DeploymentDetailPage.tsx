import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getDeploymentDetails, type Deployment } from "../../lib/api";

export default function DeploymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deploymentId = Number(id);

  const {
    data: deployment,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["deployment", deploymentId],
    queryFn: () => getDeploymentDetails(deploymentId),
    enabled: Number.isFinite(deploymentId),
    staleTime: 15_000,
    refetchInterval: (query) => {
      const deployment = query.state.data;
      return deployment?.status === "pending" ||
        deployment?.status === "building"
        ? 10_000
        : false;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-neutral-200 dark:border-d-200 border-t-black dark:border-t-d-fg rounded-full animate-spin-fast" />
            <p className="text-sm text-neutral-500 dark:text-d-500">
              Loading deployment…
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !deployment) {
    return (
      <DashboardLayout>
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-lg">
              !
            </div>
            <p className="text-sm text-neutral-500 dark:text-d-500">
              {error instanceof Error ? error.message : "Deployment not found"}
            </p>
            <Link to="/projects" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg no-underline cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg">
              Back to Projects
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1100px] mx-auto px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] mb-4">
          <Link
            to="/projects"
            className="text-neutral-500 dark:text-d-500 no-underline hover:text-black dark:hover:text-d-fg"
          >
            Projects
          </Link>
          <span className="text-neutral-300 dark:text-d-300">/</span>
          <Link
            to={`/projects/${deployment.projectId}`}
            className="text-neutral-500 dark:text-d-500 no-underline hover:text-black dark:hover:text-d-fg"
          >
            Project #{deployment.projectId}
          </Link>
          <span className="text-neutral-300 dark:text-d-300">/</span>
          <span className="text-black dark:text-d-fg font-medium">
            Deployment #{deployment.id}
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-d-fg m-0">
              Deployment #{deployment.id}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-d-500 mt-1 m-0 flex items-center gap-2">
              <StatusBadge status={deployment.status} />
              <span>Created {formatDateTime(deployment.createdAt)}</span>
            </p>
          </div>
          {deployment.cdnUrl && (
            <a
              href={deployment.cdnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent rounded-lg no-underline cursor-pointer transition-all duration-150 hover:opacity-85"
            >
              <svg
                width="14"
                height="14"
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
              Visit Site
            </a>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-6">
          <InfoCard label="Status" value={deployment.status.toUpperCase()} />
          <InfoCard label="Public ID" value={deployment.publicId} mono />
          <InfoCard
            label="Created"
            value={formatDateTime(deployment.createdAt)}
          />
          <InfoCard
            label="Updated"
            value={formatDateTime(deployment.updatedAt)}
          />
          {deployment.commitHash && (
            <InfoCard
              label="Commit"
              value={deployment.commitHash.slice(0, 8)}
              mono
            />
          )}
          {deployment.cdnUrl && (
            <InfoCard label="CDN URL" value={deployment.cdnUrl} mono />
          )}
        </div>

        {/* Build Logs */}
        {deployment.logs && (
          <div className="mb-6">
            <h3 className="text-[15px] font-semibold m-0 mb-3 text-black dark:text-d-fg">
              Build Logs
            </h3>
            <pre className="bg-[#1a1a1a] text-[#e5e5e5] px-5 py-5 rounded-xl font-mono text-[12px] leading-[1.7] overflow-x-auto whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto">
              {deployment.logs}
            </pre>
          </div>
        )}

        {/* Building indicator */}
        {(deployment.status === "pending" ||
          deployment.status === "building") && (
          <div className="flex flex-col items-center gap-3 py-10 border border-neutral-200 dark:border-d-200 rounded-xl text-center">
            <div className="flex gap-1.5">
              {[0, 200, 400].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-black dark:bg-d-fg animate-building-pulse"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <p className="text-sm font-medium m-0 text-black dark:text-d-fg">
              {deployment.status === "pending"
                ? "Waiting for build worker…"
                : "Build in progress…"}
            </p>
            <span className="text-[12px] text-neutral-400 dark:text-d-400">
              Wait a minute…
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 p-4 border border-neutral-200 dark:border-d-200 rounded-lg">
      <span className="text-[12px] text-neutral-400 dark:text-d-400 uppercase tracking-[0.05em]">
        {label}
      </span>
      <span
        className={`text-sm font-medium text-black dark:text-d-fg break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
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
