import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getProjectDetails,
  createDeployment,
  getProjectDeployments,
  updateProject,
  getDeployedUrl,
  type Project,
  type Deployment,
} from "../../lib/api";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"deployments" | "settings">(
    "deployments",
  );

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: Number.isFinite(projectId),
    staleTime: 60_000,
  });

  const deploymentsQuery = useQuery({
    queryKey: ["projectDeployments", projectId],
    queryFn: () => getProjectDeployments(projectId),
    enabled: Number.isFinite(projectId),
    staleTime: 15_000,
    // Seed from the dashboard cache to avoid duplicate fetches when navigating from there
    initialData: () => {
      const cached = queryClient.getQueryData<{ allDeployments: Deployment[] }>(
        ["dashboard"],
      );
      if (!cached) return undefined;
      return cached.allDeployments.filter((d) => d.projectId === projectId);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["dashboard"])?.dataUpdatedAt,
  });

  const deployMutation = useMutation({
    mutationFn: () => createDeployment(projectId),
    onSuccess: (deployment) => {
      queryClient.setQueryData<Deployment[]>(
        ["projectDeployments", projectId],
        (current = []) => [deployment, ...current],
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const project = projectQuery.data;
  const deployments = deploymentsQuery.data ?? [];
  const loading = projectQuery.isLoading || deploymentsQuery.isLoading;
  const error = projectQuery.error || deploymentsQuery.error;

  const handleDeploy = async () => {
    try {
      await deployMutation.mutateAsync();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Deployment failed");
    }
  };

  // ─── Skeleton loading state ─────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-1.5 mb-4">
            <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-d-200 animate-pulse" />
            <span className="text-neutral-300 dark:text-d-300">/</span>
            <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-d-200 animate-pulse" />
          </div>

          {/* Header skeleton */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="h-7 w-48 rounded-lg bg-neutral-200 dark:bg-d-200 animate-pulse mb-2" />
              <div className="h-4 w-36 rounded bg-neutral-200 dark:bg-d-200 animate-pulse" />
            </div>
            <div className="h-10 w-24 rounded-lg bg-neutral-200 dark:bg-d-200 animate-pulse" />
          </div>

          {/* Preview image skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
            <div className="h-16 rounded-xl bg-neutral-100 dark:bg-d-100 animate-pulse" />
            <div className="hidden md:block w-[220px] h-[140px] rounded-xl bg-neutral-100 dark:bg-d-100 animate-pulse" />
          </div>

          {/* Tabs skeleton */}
          <div className="flex border-b border-neutral-200 dark:border-d-200 mb-6">
            <div className="h-5 w-24 rounded bg-neutral-200 dark:bg-d-200 animate-pulse mx-4 my-2.5" />
            <div className="h-5 w-16 rounded bg-neutral-200 dark:bg-d-200 animate-pulse mx-4 my-2.5" />
          </div>

          {/* Deployment list skeleton rows */}
          <div className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-d-100 last:border-b-0"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-14 rounded-full bg-neutral-200 dark:bg-d-200 animate-pulse" />
                    <div className="h-4 w-10 rounded bg-neutral-200 dark:bg-d-200 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-neutral-100 dark:bg-d-100 animate-pulse" />
                  </div>
                  <div className="h-3 w-40 rounded bg-neutral-100 dark:bg-d-100 animate-pulse" />
                </div>
                <div className="h-8 w-16 rounded-lg bg-neutral-200 dark:bg-d-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-lg">
              !
            </div>
            <p className="text-sm text-neutral-500 dark:text-d-500">
              {error instanceof Error ? error.message : "Project not found"}
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg no-underline cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const deployedUrl = getDeployedUrl(project.publicId);
  const hasSuccessDeployment = deployments.some((d) => d.status === "success");

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
          <span className="text-black dark:text-d-fg font-medium">
            {project.name}
          </span>
        </nav>

        {/* Project Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-d-fg m-0">
              {project.name}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-d-500 mt-1 m-0 flex items-center gap-1.5">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-neutral-500 dark:text-d-500 no-underline transition-colors duration-150 hover:text-black dark:hover:text-d-fg"
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
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                {extractRepoName(project.repoUrl)}
              </a>
            </p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent rounded-lg no-underline cursor-pointer transition-all duration-150 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDeploy}
            disabled={deployMutation.isPending}
          >
            {deployMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin-fast opacity-70" />
                Deploying…
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                Deploy
              </>
            )}
          </button>
        </div>

        {/* Deployed URL + Preview — shown when a successful deployment exists */}
        {hasSuccessDeployment && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
            {/* Deployed URL card */}
            <DeployedUrlCard url={deployedUrl} />

            {/* Preview screenshot */}
            {project.previewUrl && (
              <div className="border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden bg-neutral-50 dark:bg-d-50 md:w-[220px]">
                <a
                  href={deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={project.previewUrl}
                    alt={`${project.name} preview`}
                    className="w-full h-full object-cover block max-h-[140px]"
                  />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-d-200 mb-6">
          <button
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 transition-all duration-150 ${activeTab === "deployments" ? "text-black dark:text-d-fg border-b-black dark:border-b-d-fg font-medium" : "text-neutral-500 dark:text-d-500 border-b-transparent hover:text-black dark:hover:text-d-fg"}`}
            onClick={() => setActiveTab("deployments")}
          >
            Deployments
            {deployments.length > 0 && (
              <span className="text-[11px] bg-neutral-100 dark:bg-d-100 text-neutral-500 dark:text-d-500 px-1.5 py-[1px] rounded-full">
                {deployments.length}
              </span>
            )}
          </button>
          <button
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 transition-all duration-150 ${activeTab === "settings" ? "text-black dark:text-d-fg border-b-black dark:border-b-d-fg font-medium" : "text-neutral-500 dark:text-d-500 border-b-transparent hover:text-black dark:hover:text-d-fg"}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "deployments" && (
          <DeploymentsTab deployments={deployments} project={project} />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            project={project}
            onUpdate={(updated) => {
              queryClient.setQueryData(["project", projectId], updated);
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Deployed URL Card ────────────────────────────────────
function DeployedUrlCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 bg-neutral-50 dark:bg-d-50 border border-neutral-200 dark:border-d-200 rounded-xl">
      <div className="w-9 h-9 rounded-full bg-black dark:bg-d-fg text-white dark:text-d-bg flex items-center justify-center shrink-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-[11px] uppercase tracking-[0.06em] text-neutral-400 dark:text-d-400 font-semibold mb-0.5">
          Live URL
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium text-black dark:text-d-fg no-underline overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-150 hover:text-neutral-600 dark:hover:text-d-600"
        >
          {url}
        </a>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-sans rounded-md cursor-pointer transition-all duration-150 border ${copied ? "text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 bg-transparent" : "text-neutral-500 dark:text-d-500 border-neutral-200 dark:border-d-200 bg-white dark:bg-d-bg hover:border-neutral-300 dark:hover:border-d-300 hover:text-black dark:hover:text-d-fg"}`}
        >
          {copied ? (
            <>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-sans text-white dark:text-d-bg bg-black dark:bg-d-fg border border-transparent rounded-md no-underline cursor-pointer transition-all duration-150 hover:opacity-85"
        >
          <svg
            width="11"
            height="11"
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
        </a>
      </div>
    </div>
  );
}

// ─── Deployments Tab ─────────────────────────────────────
function DeploymentsTab({
  deployments,
  project,
}: {
  deployments: Deployment[];
  project: Project;
}) {
  if (deployments.length === 0) {
    return (
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
        <p className="text-sm text-neutral-500 dark:text-d-500 m-0">
          Click "Deploy" to trigger your first build.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden">
      {deployments.map((dep) => (
        <div
          key={dep.id}
          className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-d-100 last:border-b-0 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-d-50"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={dep.status} />
              <span className="text-sm font-semibold text-black dark:text-d-fg">
                #{dep.id}
              </span>
            </div>
            <div className="text-[13px] text-neutral-500 dark:text-d-500 flex items-center gap-1">
              <span>{project.name}</span>
              <span className="text-neutral-300 dark:text-d-300">·</span>
              <span>{formatDateTime(dep.createdAt)}</span>
              {dep.commitHash && (
                <>
                  <span className="text-neutral-300 dark:text-d-300">·</span>
                  <span className="font-mono text-[12px]">
                    {dep.commitHash.slice(0, 7)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            {dep.cdnUrl && (
              <a
                href={dep.cdnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium font-sans bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg no-underline cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg"
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
              </a>
            )}
            <Link
              to={`/deployments/${dep.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium font-sans bg-white dark:bg-d-bg text-neutral-600 dark:text-d-600 border border-neutral-200 dark:border-d-200 rounded-lg no-underline cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg"
            >
              Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────
function SettingsTab({
  project,
  onUpdate,
}: {
  project: Project;
  onUpdate: (p: Project) => void;
}) {
  const [form, setForm] = useState({
    name: project.name,
    repoUrl: project.repoUrl,
    rootDir: project.rootDir,
    installCmd: project.installCmd,
    buildCmd: project.buildCmd,
    outputDir: project.outputDir,
    framework: project.framework || "",
  });
  const [envText, setEnvText] = useState(
    Object.entries(project.envVars || {})
      .map(([k, v]) => `${k}=${v}`)
      .join("\n"),
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const envVars: Record<string, string> = {};
      envText
        .split("\n")
        .filter((line) => line.includes("="))
        .forEach((line) => {
          const idx = line.indexOf("=");
          envVars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        });

      const updated = await updateProject({
        id: project.id,
        ...form,
        framework: form.framework || undefined,
        envVars,
      });
      onUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const inputClasses =
    "w-full px-3 py-2 text-sm font-sans border border-neutral-300 dark:border-d-300 rounded-lg bg-white dark:bg-d-bg text-black dark:text-d-fg outline-none transition-all duration-150 focus:border-black dark:focus:border-d-fg focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] box-border";

  return (
    <form
      className="max-w-180 rounded-2xl border border-neutral-200 dark:border-d-200 bg-white dark:bg-d-50 p-6 shadow-sm"
      onSubmit={handleSave}
    >
      {error && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
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
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 text-sm text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">
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
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Settings saved successfully
        </div>
      )}

      {/* General Section */}
      <div className="mb-7">
        <h3 className="text-sm font-semibold text-black dark:text-d-fg m-0 mb-4 pb-3 border-b border-neutral-200 dark:border-d-200">
          General
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[13px] font-medium text-neutral-600 dark:text-d-600"
              htmlFor="s-name"
            >
              Project Name
            </label>
            <input
              id="s-name"
              className={inputClasses}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[13px] font-medium text-neutral-600 dark:text-d-600"
              htmlFor="s-repo"
            >
              Repository URL
            </label>
            <input
              id="s-repo"
              className={inputClasses}
              value={form.repoUrl}
              onChange={(e) => handleChange("repoUrl", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Build Configuration Section */}
      <div className="mb-7">
        <h3 className="text-sm font-semibold text-black dark:text-d-fg m-0 mb-4 pb-3 border-b border-neutral-200 dark:border-d-200">
          Build Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[13px] font-medium text-neutral-600 dark:text-d-600"
              htmlFor="s-root"
            >
              Root Directory
            </label>
            <input
              id="s-root"
              className={inputClasses}
              value={form.rootDir}
              onChange={(e) => handleChange("rootDir", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[13px] font-medium text-neutral-600 dark:text-d-600"
              htmlFor="s-framework"
            >
              Framework
            </label>
            <input
              id="s-framework"
              className={inputClasses}
              placeholder="Auto-detected"
              value={form.framework}
              onChange={(e) => handleChange("framework", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[13px] font-medium text-neutral-600 dark:text-d-600"
              htmlFor="s-install"
            >
              Install Command
            </label>
            <input
              id="s-install"
              className={`${inputClasses} font-mono`}
              value={form.installCmd}
              onChange={(e) => handleChange("installCmd", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[13px] font-medium text-neutral-600 dark:text-d-600"
              htmlFor="s-build"
            >
              Build Command
            </label>
            <input
              id="s-build"
              className={`${inputClasses} font-mono`}
              value={form.buildCmd}
              onChange={(e) => handleChange("buildCmd", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[13px] font-medium text-neutral-600 dark:text-d-600"
              htmlFor="s-output"
            >
              Output Directory
            </label>
            <input
              id="s-output"
              className={`${inputClasses} font-mono`}
              value={form.outputDir}
              onChange={(e) => handleChange("outputDir", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Environment Variables Section */}
      <div className="mb-0">
        <h3 className="text-sm font-semibold text-black dark:text-d-fg m-0 mb-1 pb-3 border-b border-neutral-200 dark:border-d-200">
          Environment Variables
        </h3>
        <p className="text-[13px] text-neutral-500 dark:text-d-500 mt-0 mb-3">
          One per line, in KEY=VALUE format
        </p>
        <textarea
          className={`${inputClasses} font-mono text-[13px] leading-relaxed resize-y`}
          rows={6}
          placeholder={
            "NEXT_PUBLIC_API_URL=https://api.example.com\nNODE_ENV=production"
          }
          value={envText}
          onChange={(e) => setEnvText(e.target.value)}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-neutral-200 dark:border-d-200">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent rounded-lg cursor-pointer transition-all duration-150 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin-fast opacity-70" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Shared Components ───────────────────────────────────
function StatusBadge({ status }: { status: Deployment["status"] }) {
  const config: Record<
    string,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pending",
      className:
        "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide whitespace-nowrap bg-amber-500/10 text-amber-600",
    },
    building: {
      label: "Building",
      className:
        "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide whitespace-nowrap bg-blue-500/10 text-blue-600",
    },
    success: {
      label: "Ready",
      className:
        "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide whitespace-nowrap bg-green-500/10 text-green-600",
    },
    failed: {
      label: "Failed",
      className:
        "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide whitespace-nowrap bg-red-500/10 text-red-600",
    },
    cancelled: {
      label: "Cancelled",
      className:
        "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide whitespace-nowrap bg-neutral-500/10 text-neutral-500",
    },
  };
  const c = config[status] || config.pending;
  return <span className={c.className}>{c.label}</span>;
}

function extractRepoName(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : url;
  } catch {
    return url;
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
