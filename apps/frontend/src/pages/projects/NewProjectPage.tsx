import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { createProject, type GithubRepo } from "../../lib/api";
import { useGithubRepos } from "../../lib/hooks/useGithubRepos";

export default function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reposQuery = useGithubRepos();

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
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

    try {
      await createProjectMutation.mutateAsync({
        name,
        repoUrl: selectedRepo.clone_url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

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

            <div>
              <label
                htmlFor="repo-select"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Repository
              </label>

              <select
                id="repo-select"
                value={selectedRepo?.id ?? ""}
                onChange={(e) => {
                  const repo = reposQuery.data?.find(
                    (r) => r.id === Number(e.target.value),
                  );

                  if (!repo) return;

                  setSelectedRepo(repo);
                  if (!name.trim()) {
                    setName(repo.name);
                  }
                }}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              >
                <option value="">Select repository</option>
                {reposQuery.data?.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.full_name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-zinc-500">
                Select a public GitHub repository
              </p>
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
