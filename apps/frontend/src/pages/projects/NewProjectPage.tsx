import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  createProject,
  type GithubRepo,
  type DashboardData,
  type CreateProjectInput,
} from "../../lib/api";
import { useGithubRepos } from "../../lib/hooks/useGithubRepos";

interface RepoOption {
  value: GithubRepo;
  label: string;
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBuildSettings, setShowBuildSettings] = useState(false);

  // Build config fields
  const [rootDir, setRootDir] = useState("/");
  const [framework, setFramework] = useState("");
  const [installCmd, setInstallCmd] = useState("npm install");
  const [buildCmd, setBuildCmd] = useState("npm run build");
  const [outputDir, setOutputDir] = useState("dist");
  const [envText, setEnvText] = useState("");

  const reposQuery = useGithubRepos();

  const repoOptions: RepoOption[] = (reposQuery.data ?? []).map((repo) => ({
    value: repo,
    label: repo.full_name,
  }));

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      // Optimistically insert the new project into the dashboard cache
      queryClient.setQueryData<DashboardData>(["dashboard"], (old) => {
        if (!old) return old;
        return {
          ...old,
          projects: [{ ...project }, ...old.projects],
        };
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/projects/${project.id}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!selectedRepo) {
      setError("Please select a repository");
      return;
    }

    // Parse env vars from textarea
    const envVars: Record<string, string> = {};
    envText
      .split("\n")
      .filter((line) => line.includes("="))
      .forEach((line) => {
        const idx = line.indexOf("=");
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key) envVars[key] = val;
      });

    const payload: CreateProjectInput = {
      name,
      repoUrl: selectedRepo.clone_url,
      ...(rootDir !== "/" && { rootDir }),
      ...(installCmd !== "npm install" && { installCmd }),
      ...(buildCmd !== "npm run build" && { buildCmd }),
      ...(outputDir !== "dist" && { outputDir }),
      ...(framework && { framework }),
      ...(Object.keys(envVars).length > 0 && { envVars }),
    };

    try {
      await createProjectMutation.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  // Detect dark mode from the HTML data-theme attribute
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <DashboardLayout>
      <div className="max-w-160 mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-d-fg m-0">
              New Project
            </h1>
            <p className="text-sm text-neutral-500 dark:text-d-500 mt-1 m-0">
              Import a GitHub repository to deploy
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
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

          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Project Name
              </label>

              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder="my-website"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              />

              <p className="mt-2 text-xs text-zinc-500">
                A unique name for your project
              </p>
            </div>

            {/* Repository — React Select */}
            <div>
              <label
                htmlFor="repo-select"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Repository
              </label>

              <Select<RepoOption>
                inputId="repo-select"
                options={repoOptions}
                isLoading={reposQuery.isLoading}
                placeholder="Search repositories…"
                noOptionsMessage={() =>
                  reposQuery.isLoading
                    ? "Loading repositories…"
                    : "No repositories found"
                }
                value={
                  selectedRepo
                    ? repoOptions.find(
                        (o) => o.value.id === selectedRepo.id,
                      ) ?? null
                    : null
                }
                onChange={(option) => {
                  if (!option) {
                    setSelectedRepo(null);
                    return;
                  }
                  setSelectedRepo(option.value);
                  if (!name.trim()) {
                    setName(option.value.name);
                  }
                }}
                isClearable
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: "0.75rem",
                    borderColor: state.isFocused
                      ? isDark
                        ? "#71717a"
                        : "#18181b"
                      : isDark
                        ? "#3f3f46"
                        : "#d4d4d8",
                    backgroundColor: isDark ? "#09090b" : "#ffffff",
                    padding: "0.25rem 0.25rem",
                    fontSize: "0.875rem",
                    boxShadow: state.isFocused
                      ? isDark
                        ? "0 0 0 1px #71717a"
                        : "0 0 0 1px #18181b"
                      : "none",
                    "&:hover": {
                      borderColor: isDark ? "#52525b" : "#a1a1aa",
                    },
                    minHeight: "44px",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "0.75rem",
                    border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`,
                    backgroundColor: isDark ? "#18181b" : "#ffffff",
                    boxShadow:
                      "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    zIndex: 50,
                    marginTop: "4px",
                  }),
                  menuList: (base) => ({
                    ...base,
                    padding: "0.25rem",
                    maxHeight: "240px",
                  }),
                  option: (base, state) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: state.isFocused
                      ? isDark
                        ? "#27272a"
                        : "#f4f4f5"
                      : "transparent",
                    color: isDark ? "#fafafa" : "#18181b",
                    cursor: "pointer",
                    "&:active": {
                      backgroundColor: isDark ? "#3f3f46" : "#e4e4e7",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: isDark ? "#fafafa" : "#18181b",
                  }),
                  input: (base) => ({
                    ...base,
                    color: isDark ? "#fafafa" : "#18181b",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                  }),
                  indicatorSeparator: () => ({ display: "none" }),
                  dropdownIndicator: (base, state) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                    transition: "transform 150ms",
                    transform: state.selectProps.menuIsOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    "&:hover": {
                      color: isDark ? "#a1a1aa" : "#52525b",
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                    "&:hover": {
                      color: isDark ? "#fafafa" : "#18181b",
                    },
                  }),
                  loadingIndicator: (base) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                  }),
                  noOptionsMessage: (base) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                    fontSize: "0.875rem",
                  }),
                }}
              />

              <p className="mt-2 text-xs text-zinc-500">
                Search and select a public GitHub repository
              </p>
            </div>

            {/* Build Settings Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowBuildSettings(!showBuildSettings)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-transparent border-none cursor-pointer transition hover:text-zinc-900 dark:hover:text-zinc-200 p-0"
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
                  className={`transition-transform duration-200 ${showBuildSettings ? "rotate-90" : ""}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                Build &amp; Output Settings
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">
                  (optional)
                </span>
              </button>

              {showBuildSettings && (
                <div className="mt-4 space-y-4 pl-0 animate-fade-in">
                  {/* Root Dir + Framework */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="root-dir"
                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Root Directory
                      </label>
                      <input
                        id="root-dir"
                        type="text"
                        value={rootDir}
                        onChange={(e) => setRootDir(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                      />
                      <p className="mt-1 text-xs text-zinc-400">
                        Subdirectory containing your app
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="framework"
                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Framework
                      </label>
                      <input
                        id="framework"
                        type="text"
                        value={framework}
                        onChange={(e) => setFramework(e.target.value)}
                        placeholder="e.g. vite, next, cra, astro"
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                      />
                      <p className="mt-1 text-xs text-zinc-400">
                        Optional — helps optimize builds
                      </p>
                    </div>
                  </div>

                  {/* Install + Build Commands */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="install-cmd"
                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Install Command
                      </label>
                      <input
                        id="install-cmd"
                        type="text"
                        value={installCmd}
                        onChange={(e) => setInstallCmd(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="build-cmd"
                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Build Command
                      </label>
                      <input
                        id="build-cmd"
                        type="text"
                        value={buildCmd}
                        onChange={(e) => setBuildCmd(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                      />
                    </div>
                  </div>

                  {/* Output Directory */}
                  <div className="max-w-[50%]">
                    <label
                      htmlFor="output-dir"
                      className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Output Directory
                    </label>
                    <input
                      id="output-dir"
                      type="text"
                      value={outputDir}
                      onChange={(e) => setOutputDir(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                    <p className="mt-1 text-xs text-zinc-400">
                      Directory containing the built output
                    </p>
                  </div>

                  {/* Environment Variables */}
                  <div>
                    <label
                      htmlFor="env-vars"
                      className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Environment Variables
                    </label>
                    <textarea
                      id="env-vars"
                      rows={4}
                      value={envText}
                      onChange={(e) => setEnvText(e.target.value)}
                      placeholder={
                        "VITE_API_URL=https://api.example.com\nNEXT_PUBLIC_KEY=your-key"
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-mono outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 resize-y leading-relaxed"
                    />
                    <p className="mt-1 text-xs text-zinc-400">
                      One per line, KEY=VALUE format. These are injected into
                      install and build steps.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {createProjectMutation.isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
