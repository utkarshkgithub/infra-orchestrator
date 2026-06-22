import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  getDashboardData,
  getDeployedUrl,
  type ProjectWithDeployment,
  type Deployment,
} from '../../lib/api';

type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Single query replaces two separate calls — no more duplicate GET /deployment/
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 30_000,
  });

  const projects = data?.projects ?? [];
  const allDeployments = data?.allDeployments ?? [];

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

  // Recent deployments (last 5) for the activity feed
  const recentDeployments = useMemo(() => {
    return [...allDeployments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allDeployments]);

  const projectMap = useMemo(() => {
    const map = new Map<number, ProjectWithDeployment>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  return (
    <DashboardLayout>
      <div className="max-w-[1100px] mx-auto px-8 py-8">
        {/* Search + View Controls */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-[480px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-d-400 pointer-events-none"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="search-projects"
              type="text"
              className="w-full pl-9 pr-3 py-2 text-sm font-sans border border-neutral-200 dark:border-d-200 rounded-lg bg-white dark:bg-d-bg text-black dark:text-d-fg outline-none transition-all duration-150 placeholder:text-neutral-400 dark:placeholder:text-d-400 focus:border-neutral-400 dark:focus:border-d-400 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] box-border"
              placeholder="Search Projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View toggle */}
            <div className="flex border border-neutral-200 dark:border-d-200 rounded-lg overflow-hidden">
              <button
                className={`flex items-center justify-center w-9 h-[34px] border-none transition-all duration-150 cursor-pointer border-r border-neutral-200 dark:border-d-200 ${viewMode === 'grid' ? 'bg-neutral-50 dark:bg-d-50 text-black dark:text-d-fg' : 'bg-white dark:bg-d-bg text-neutral-400 dark:text-d-400 hover:text-black dark:hover:text-d-fg hover:bg-neutral-50 dark:hover:bg-d-50'}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                className={`flex items-center justify-center w-9 h-[34px] border-none transition-all duration-150 cursor-pointer ${viewMode === 'list' ? 'bg-neutral-50 dark:bg-d-50 text-black dark:text-d-fg' : 'bg-white dark:bg-d-bg text-neutral-400 dark:text-d-400 hover:text-black dark:hover:text-d-fg hover:bg-neutral-50 dark:hover:bg-d-50'}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>

            <Link to="/projects/new" className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent rounded-lg no-underline cursor-pointer transition-all duration-150 hover:opacity-85">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add New…
            </Link>
          </div>
        </div>

        {/* Two-column layout: Projects (main) + Activity (right sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_268px] gap-6">
          {/* Main: Projects */}
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-black dark:text-d-fg m-0 flex items-center gap-2">
                Projects
                {!isLoading && !error && (
                  <span className="text-[11px] font-medium bg-neutral-100 dark:bg-d-100 text-neutral-500 dark:text-d-500 px-[7px] py-[1px] rounded-full">
                    {filteredProjects.length}
                  </span>
                )}
              </h2>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 border-2 border-neutral-200 dark:border-d-200 border-t-black dark:border-t-d-fg rounded-full animate-spin-fast" />
                <p className="text-sm text-neutral-500 dark:text-d-500">Loading projects…</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-lg">!</div>
                <p className="text-sm text-neutral-500 dark:text-d-500">
                  {error instanceof Error ? error.message : 'Failed to load projects'}
                </p>
                <button className="btn btn-secondary" onClick={() => refetch()}>Retry</button>
              </div>
            )}

            {!isLoading && !error && filteredProjects.length === 0 && (
              <div className="flex flex-col items-center text-center py-16 border border-dashed border-neutral-200 dark:border-d-200 rounded-xl gap-2">
                {searchQuery ? (
                  <>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300 dark:text-d-300">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <h3 className="text-base font-semibold m-0 mt-2 text-black dark:text-d-fg">No matching projects</h3>
                    <p className="text-sm text-neutral-500 dark:text-d-500 m-0 mb-4">Try adjusting your search query.</p>
                    <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>Clear search</button>
                  </>
                ) : (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300 dark:text-d-300">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3 className="text-base font-semibold m-0 mt-2 text-black dark:text-d-fg">No projects yet</h3>
                    <p className="text-sm text-neutral-500 dark:text-d-500 m-0 mb-4">Create your first project to get started.</p>
                    <Link to="/projects/new" className="btn btn-primary">Create Project</Link>
                  </>
                )}
              </div>
            )}

            {!isLoading && !error && filteredProjects.length > 0 && (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl overflow-hidden">
                  {filteredProjects.map((project) => (
                    <ProjectListItem key={project.id} project={project} />
                  ))}
                </div>
              )
            )}
          </section>

          {/* Right: Activity Feed */}
          <aside className="flex flex-col gap-5">
            <div className="border border-neutral-200 dark:border-d-200 rounded-xl p-4">
              <h3 className="text-[11px] font-semibold text-neutral-500 dark:text-d-500 uppercase tracking-[0.05em] m-0 mb-3">
                Recent Activity
              </h3>
              {recentDeployments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-5 px-2 text-center text-neutral-400 dark:text-d-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p className="text-[13px] m-0">No recent deployments.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {recentDeployments.map((dep) => {
                    const proj = projectMap.get(dep.projectId);
                    return (
                      <Link
                        key={dep.id}
                        to={`/deployments/${dep.id}`}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-md no-underline text-inherit transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-d-50"
                      >
                        <StatusDot status={dep.status} />
                        <div className="flex-1 min-w-0 flex flex-col gap-[1px]">
                          <span className="text-[13px] font-medium text-black dark:text-d-fg overflow-hidden text-ellipsis whitespace-nowrap">
                            {proj?.name || `Project #${dep.projectId}`}
                          </span>
                          <span className="text-[11px] text-neutral-400 dark:text-d-400">
                            {formatRelativeTime(dep.createdAt)}
                          </span>
                        </div>
                        <DeploymentStatusBadge status={dep.status} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Project Card (Grid View) ────────────────────────────
function ProjectCard({ project }: { project: ProjectWithDeployment }) {
  const dep = project.latestDeployment;
  const deployedUrl = getDeployedUrl(project.publicId);

  return (
    <Link to={`/projects/${project.id}`} className="flex flex-col border border-neutral-200 dark:border-d-200 rounded-xl no-underline text-black dark:text-d-fg bg-white dark:bg-d-bg overflow-hidden transition-all duration-150 hover:border-neutral-300 dark:hover:border-d-300 hover:shadow-md hover:-translate-y-px">
      {/* Preview thumbnail */}
      <div className="w-full h-[130px] bg-neutral-100 dark:bg-d-100 overflow-hidden flex items-center justify-center border-b border-neutral-100 dark:border-d-100">
        {project.previewUrl ? (
          <img src={project.previewUrl} alt={`${project.name} preview`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-neutral-300 dark:text-d-300 text-[11px]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            No preview yet
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col px-5 pt-4 pb-5">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-black dark:bg-d-fg text-white dark:text-d-bg flex items-center justify-center shrink-0">
            {project.framework ? (
              <span className="text-sm font-bold" title={project.framework}>{project.framework.charAt(0).toUpperCase()}</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold text-black dark:text-d-fg overflow-hidden text-ellipsis whitespace-nowrap">{project.name}</span>
            {dep?.status === 'success' && (
              <span className="block text-[11px] text-neutral-400 dark:text-d-400 overflow-hidden text-ellipsis whitespace-nowrap">{deployedUrl.replace('https://', '')}</span>
            )}
          </div>
          <button
            className="shrink-0 w-7 h-7 flex items-center justify-center border-none bg-transparent text-neutral-400 dark:text-d-400 rounded-md cursor-pointer transition-all duration-150 opacity-0 group-hover:opacity-100 hover:text-black dark:hover:text-d-fg hover:bg-neutral-100 dark:hover:bg-d-100"
            onClick={(e) => e.preventDefault()}
            aria-label="More options"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>

        {/* Repo */}
        <div className="flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-d-500 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{extractRepoName(project.repoUrl)}</span>
        </div>

        {dep && (
          <div className="flex items-center gap-2 mt-2">
            <DeploymentStatusBadge status={dep.status} />
            <span className="text-[12px] text-neutral-400 dark:text-d-400">{formatRelativeTime(dep.createdAt)}</span>
          </div>
        )}

        <div className="flex items-center mt-3 pt-3 border-t border-neutral-100 dark:border-d-100">
          {dep?.commitHash && (
            <span className="inline-flex items-center gap-1 text-[12px] font-mono text-neutral-500 dark:text-d-500">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" /><line x1="1.05" y1="12" x2="7" y2="12" /><line x1="17.01" y1="12" x2="22.96" y2="12" />
              </svg>
              {dep.commitHash.slice(0, 7)}
            </span>
          )}
          <span className="text-[12px] text-neutral-400 dark:text-d-400 ml-auto">{formatRelativeTime(project.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Project List Item (List View) ───────────────────────
function ProjectListItem({ project }: { project: ProjectWithDeployment }) {
  const dep = project.latestDeployment;

  return (
    <Link to={`/projects/${project.id}`} className="flex items-center px-5 py-3.5 no-underline text-inherit border-b border-neutral-100 dark:border-d-100 last:border-b-0 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-d-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-7 h-7 rounded-md bg-black dark:bg-d-fg text-white dark:text-d-bg flex items-center justify-center shrink-0 text-[12px]">
          {project.framework ? (
            <span className="font-bold">{project.framework.charAt(0).toUpperCase()}</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            </svg>
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[14px] font-semibold text-black dark:text-d-fg overflow-hidden text-ellipsis whitespace-nowrap">{project.name}</span>
          <span className="text-[12px] text-neutral-500 dark:text-d-500 overflow-hidden text-ellipsis whitespace-nowrap">{extractRepoName(project.repoUrl)}</span>
        </div>
      </div>
      <div className="shrink-0 mx-6">
        {dep && <DeploymentStatusBadge status={dep.status} />}
      </div>
      <div className="shrink-0">
        <span className="text-[12px] text-neutral-400 dark:text-d-400">{formatRelativeTime(project.createdAt)}</span>
      </div>
    </Link>
  );
}

// ─── Shared Components ───────────────────────────────────
function DeploymentStatusBadge({ status }: { status: Deployment['status'] }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Queued', className: 'badge badge-pending' },
    building: { label: 'Building', className: 'badge badge-building' },
    success: { label: 'Ready', className: 'badge badge-success' },
    failed: { label: 'Error', className: 'badge badge-failed' },
    cancelled: { label: 'Cancelled', className: 'badge badge-cancelled' },
  };
  const c = config[status] || config.pending;
  return <span className={c.className}>{c.label}</span>;
}

function StatusDot({ status }: { status: Deployment['status'] }) {
  const colors: Record<string, string> = {
    pending: '#f59e0b',
    building: '#3b82f6',
    success: '#22c55e',
    failed: '#ef4444',
    cancelled: '#6b7280',
  };
  return (
    <span
      className="block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: colors[status] || colors.pending }}
    />
  );
}

// ─── Utility Functions ───────────────────────────────────
function extractRepoName(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : url;
  } catch {
    return url;
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
