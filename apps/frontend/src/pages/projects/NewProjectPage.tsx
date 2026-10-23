/**
 * NewProjectPage — import a GitHub repo and create a project.
 * Was 938 lines. Now ~200 lines. Framework picker, build config, env vars
 * all extracted into dedicated components.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { FrameworkPicker } from "../../components/newProject/FrameworkPicker";
import { RepoSelector } from "../../components/newProject/RepoSelector";
import { DirInput } from "../../components/newProject/DirInput";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { createProject, GITHUB_APP_INSTALL_URL } from "../../lib/api";
import type { GithubRepo, Project } from "../../lib/types";
import { useGithubRepos } from "../../lib/queries";
import { environmentsPayload, parseEnvVars } from "../../lib/utils";
import { FRAMEWORKS } from "../../components/newProject/frameworks";

const INPUT =
  "w-full px-3 py-2.5 text-sm font-sans border border-neutral-200 dark:border-d-200 rounded-xl bg-white dark:bg-d-bg text-black dark:text-d-fg outline-none transition-all duration-150 focus:border-neutral-400 dark:focus:border-d-400 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 box-border";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-neutral-700 dark:text-d-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-neutral-400 dark:text-d-400 m-0">{hint}</p>}
    </div>
  );
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [framework, setFramework] = useState("");
  const [installCmd, setInstallCmd] = useState("npm install");
  const [buildCmd, setBuildCmd] = useState("npm run build");
  const [rootDir, setRootDir] = useState("");
  const [outputDirSuffix, setOutputDirSuffix] = useState("dist");
  const [envText, setEnvText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const reposQuery = useGithubRepos();
  const repos = reposQuery.data ?? [];

  // Auto-fill project name from repo
  const handleRepoSelect = (repo: GithubRepo | null) => {
    setSelectedRepo(repo);
    if (repo && !name) {
      setName(repo.name);
    }
  };

  // Auto-fill build commands from framework preset
  const handleFrameworkSelect = (id: string) => {
    setFramework(id);
    const def = FRAMEWORKS.find((f) => f.id === id);
    if (def) {
      setInstallCmd(def.installCmd);
      setBuildCmd(def.buildCmd);
      setOutputDirSuffix(def.outputDirSuffix);
      setShowAdvanced(true);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRepo) throw new Error("Select a repository to continue.");
      if (!name.trim()) throw new Error("Project name is required.");

      const outputDir = outputDirSuffix ? `./${outputDirSuffix}` : "./dist";
      const normalizedRoot = rootDir ? rootDir.replace(/^[./]+/, "") : "";

      const project = await createProject({
        githubRepoId: selectedRepo.id,
        name: name.trim(),
        repoUrl: selectedRepo.html_url,
        rootDir: normalizedRoot,
        installCmd: installCmd.trim() || "npm install",
        buildCmd: buildCmd.trim() || "npm run build",
        outputDir,
        framework: framework || null,
        envVars: parseEnvVars(envText),
        environments: environmentsPayload(selectedRepo.default_branch),
      });

      return project;
    },
    onSuccess: (project: Project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Project "${project.name}" created successfully!`);
      navigate(`/projects/${project.id}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    },
  });

  const canSubmit = Boolean(selectedRepo && name.trim());

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] mb-6" aria-label="breadcrumb">
          <Link to="/projects" className="text-neutral-500 dark:text-d-500 no-underline hover:text-black dark:hover:text-d-fg transition-colors">
            Projects
          </Link>
          <span className="text-neutral-300 dark:text-d-300">/</span>
          <span className="text-black dark:text-d-fg font-medium">New Project</span>
        </nav>

        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-d-fg m-0 mb-1">
          Import a Repository
        </h1>
        <p className="text-sm text-neutral-500 dark:text-d-500 mb-8 m-0">
          Connect a GitHub repository and ship your first deployment in seconds.
        </p>

        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
        >
          {/* Repo selection */}
          <div className="p-5 border border-neutral-200 dark:border-d-200 rounded-2xl bg-white dark:bg-d-50 flex flex-col gap-4">
            <h2 className="text-[13px] font-semibold text-black dark:text-d-fg m-0">
              Select Repository
            </h2>
            <RepoSelector
              repos={repos}
              selected={selectedRepo}
              onSelect={handleRepoSelect}
              loading={reposQuery.isLoading}
              installUrl={GITHUB_APP_INSTALL_URL}
            />
          </div>

          {/* Project details */}
          <div className="p-5 border border-neutral-200 dark:border-d-200 rounded-2xl bg-white dark:bg-d-50 flex flex-col gap-4">
            <h2 className="text-[13px] font-semibold text-black dark:text-d-fg m-0">
              Project Details
            </h2>
            <Field label="Project Name" htmlFor="proj-name">
              <input
                id="proj-name"
                className={INPUT}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-awesome-app"
                required
              />
            </Field>
            <Field label="Framework" htmlFor="proj-fw">
              <FrameworkPicker value={framework} onChange={handleFrameworkSelect} />
            </Field>
          </div>

          {/* Build Config (collapsible) */}
          <div className="border border-neutral-200 dark:border-d-200 rounded-2xl bg-white dark:bg-d-50 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 text-[13px] font-semibold text-black dark:text-d-fg bg-transparent border-none cursor-pointer hover:bg-neutral-50 dark:hover:bg-d-100 transition-colors"
              onClick={() => setShowAdvanced((o) => !o)}
              aria-expanded={showAdvanced}
            >
              Build & Output Settings
              <span className={`text-neutral-400 transition-transform duration-150 ${showAdvanced ? "rotate-180" : ""}`}>▾</span>
            </button>

            {showAdvanced && (
              <div className="px-5 pb-5 flex flex-col gap-4 border-t border-neutral-100 dark:border-d-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Root Directory" htmlFor="root-dir" hint="Leave empty for repo root">
                    <DirInput id="root-dir" value={rootDir} onChange={setRootDir} placeholder="" />
                  </Field>
                  <Field label="Output Directory" htmlFor="output-dir">
                    <DirInput id="output-dir" value={outputDirSuffix} onChange={setOutputDirSuffix} placeholder="dist" />
                  </Field>
                  <Field label="Install Command" htmlFor="install-cmd">
                    <input id="install-cmd" className={`${INPUT} font-mono`} value={installCmd} onChange={(e) => setInstallCmd(e.target.value)} />
                  </Field>
                  <Field label="Build Command" htmlFor="build-cmd">
                    <input id="build-cmd" className={`${INPUT} font-mono`} value={buildCmd} onChange={(e) => setBuildCmd(e.target.value)} />
                  </Field>
                </div>

                {/* Env vars */}
                <Field label="Environment Variables" htmlFor="env-vars" hint="One per line in KEY=VALUE format">
                  <textarea
                    id="env-vars"
                    className={`${INPUT} font-mono text-[12px] leading-relaxed resize-y`}
                    rows={5}
                    placeholder={"NEXT_PUBLIC_API_URL=https://api.example.com\nNODE_ENV=production"}
                    value={envText}
                    onChange={(e) => setEnvText(e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!canSubmit}
              className="min-w-[140px]"
            >
              {createMutation.isPending ? "Creating…" : "Create & Deploy"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
