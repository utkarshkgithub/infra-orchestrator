/**
 * DashboardPage — the main projects overview.
 * Was 584 lines. Now ~120 lines. All sub-components extracted.
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { ProjectCard, ProjectCardSkeleton } from "../../components/dashboard/ProjectCard";
import { ProjectListItem } from "../../components/dashboard/ProjectListItem";
import { ActivityFeed } from "../../components/dashboard/ActivityFeed";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";

import { IconGrid, IconList, IconPlus, IconFolders, IconSearch } from "../../components/ui/icons";
import {
  groupLatestByProject,
  useDeployments,
  useProjects,
} from "../../lib/queries";
import type { ProjectWithDeployment } from "../../lib/types";

type ViewMode = "grid" | "list";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const projectsQuery = useProjects();
  const deploymentsQuery = useDeployments();

  const projects = useMemo<ProjectWithDeployment[]>(() => {
    const latest = groupLatestByProject(deploymentsQuery.data ?? []);
    return (projectsQuery.data ?? []).map((p) => ({
      ...p,
      latestDeployment: latest.get(p.id),
    }));
  }, [projectsQuery.data, deploymentsQuery.data]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.repoUrl.toLowerCase().includes(q) ||
        (p.framework && p.framework.toLowerCase().includes(q)),
    );
  }, [projects, searchQuery]);

  const recentDeployments = useMemo(
    () =>
      [...(deploymentsQuery.data ?? [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [deploymentsQuery.data],
  );

  const projectMap = useMemo(() => {
    const m = new Map<number, ProjectWithDeployment>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const isLoading = projectsQuery.isLoading || deploymentsQuery.isLoading;
  const error = projectsQuery.error || deploymentsQuery.error;

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-[440px]">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-d-400 pointer-events-none" />
            <input
              id="search-projects"
              type="search"
              className="w-full pl-9 pr-3 py-2 text-sm font-sans border border-neutral-200 dark:border-d-200 rounded-lg bg-white dark:bg-d-bg text-black dark:text-d-fg outline-none transition-all duration-150 placeholder:text-neutral-400 dark:placeholder:text-d-400 focus:border-neutral-400 dark:focus:border-d-400 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5"
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View toggle */}
            <div className="flex border border-neutral-200 dark:border-d-200 rounded-lg overflow-hidden">
              {(["grid", "list"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`flex items-center justify-center w-9 h-8 border-none cursor-pointer transition-all duration-150 ${
                    viewMode === mode
                      ? "bg-neutral-100 dark:bg-d-100 text-black dark:text-d-fg"
                      : "bg-white dark:bg-d-bg text-neutral-400 dark:text-d-400 hover:text-black dark:hover:text-d-fg"
                  } ${mode === "grid" ? "border-r border-neutral-200 dark:border-d-200" : ""}`}
                  onClick={() => setViewMode(mode)}
                  aria-label={`${mode} view`}
                  aria-pressed={viewMode === mode}
                >
                  {mode === "grid" ? <IconGrid size={15} /> : <IconList size={15} />}
                </button>
              ))}
            </div>

            <Link
              to="/projects/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent rounded-lg no-underline transition-all duration-150 hover:opacity-85"
            >
              <IconPlus size={14} />
              Add New
            </Link>
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_256px] gap-6">

          {/* Projects main */}
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-black dark:text-d-fg m-0 flex items-center gap-2">
                Projects
                {!isLoading && !error && (
                  <span className="text-[11px] font-medium bg-neutral-100 dark:bg-d-100 text-neutral-500 dark:text-d-500 px-2 py-px rounded-full">
                    {filteredProjects.length}
                  </span>
                )}
              </h2>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {!isLoading && error && (
              <ErrorState
                message={error instanceof Error ? error.message : "Failed to load projects"}
                onRetry={() => { void projectsQuery.refetch(); void deploymentsQuery.refetch(); }}
              />
            )}

            {/* Empty */}
            {!isLoading && !error && filteredProjects.length === 0 && (
              searchQuery ? (
                <EmptyState
                  icon={<IconSearch size={22} />}
                  title="No matching projects"
                  description="Try adjusting your search query."
                  action={{ label: "Clear search", onClick: () => setSearchQuery("") }}
                />
              ) : (
                <EmptyState
                  icon={<IconFolders size={22} />}
                  title="No projects yet"
                  description="Import a GitHub repository and deploy your first project in seconds."
                  action={{ label: "Create project", to: "/projects/new" }}
                />
              )
            )}

            {/* Grid or list */}
            {!isLoading && !error && filteredProjects.length > 0 && (
              viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4">
                  {filteredProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
                </div>
              ) : (
                <div className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden">
                  {filteredProjects.map((p) => <ProjectListItem key={p.id} project={p} />)}
                </div>
              )
            )}
          </section>

          {/* Activity sidebar */}
          <ActivityFeed deployments={recentDeployments} projectMap={projectMap} />
        </div>
      </div>
    </AppShell>
  );
}
