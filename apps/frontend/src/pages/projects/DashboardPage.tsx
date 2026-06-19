import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProjectsWithDeployments, getDeployments, type ProjectWithDeployment, type Deployment } from '../../lib/api';

type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const {
    data: projects = [],
    error: projectsError,
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projectsWithDeployments'],
    queryFn: getProjectsWithDeployments,
    staleTime: 30_000,
  });

  const {
    data: allDeployments = [],
  } = useQuery({
    queryKey: ['deployments'],
    queryFn: getDeployments,
    staleTime: 15_000,
  });

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

  // Recent deployments (last 5 with success status for preview section)
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
      <div className="page-container">
        {/* Search + View Controls */}
        <div className="dash-controls">
          <div className="dash-search-wrapper">
            <svg className="dash-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="search-projects"
              type="text"
              className="dash-search-input"
              placeholder="Search Projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="dash-control-right">
            <div className="dash-view-toggle">
              <button
                className={`dash-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                className={`dash-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>

            <Link to="/projects/new" className="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add New…
            </Link>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="dash-layout">
          {/* Left column: Activity feed / Recent Previews */}
          <aside className="dash-sidebar">
            <div className="dash-sidebar-section">
              <h3 className="dash-sidebar-title">Recent Activity</h3>
              {recentDeployments.length === 0 ? (
                <div className="dash-sidebar-empty">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p>No recent deployments.</p>
                </div>
              ) : (
                <div className="dash-activity-list">
                  {recentDeployments.map((dep) => {
                    const proj = projectMap.get(dep.projectId);
                    return (
                      <Link
                        key={dep.id}
                        to={`/deployments/${dep.id}`}
                        className="dash-activity-item"
                      >
                        <div className="dash-activity-dot-wrap">
                          <StatusDot status={dep.status} />
                        </div>
                        <div className="dash-activity-content">
                          <span className="dash-activity-project">
                            {proj?.name || `Project #${dep.projectId}`}
                          </span>
                          <span className="dash-activity-time">
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

          {/* Right column: Projects */}
          <section className="dash-projects-section">
            <div className="dash-projects-header">
              <h2 className="dash-projects-title">
                Projects
                {!projectsLoading && !projectsError && (
                  <span className="dash-projects-count">{filteredProjects.length}</span>
                )}
              </h2>
            </div>

            {projectsLoading && (
              <div className="state-container">
                <div className="loader-spinner" />
                <p className="state-text">Loading projects…</p>
              </div>
            )}

            {projectsError && (
              <div className="state-container">
                <div className="error-icon">!</div>
                <p className="state-text">{projectsError instanceof Error ? projectsError.message : 'Failed to load projects'}</p>
                <button className="btn btn-secondary" onClick={() => refetchProjects()}>
                  Retry
                </button>
              </div>
            )}

            {!projectsLoading && !projectsError && filteredProjects.length === 0 && (
              <div className="empty-state">
                {searchQuery ? (
                  <>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <h3>No matching projects</h3>
                    <p>Try adjusting your search query.</p>
                    <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3>No projects yet</h3>
                    <p>Create your first project to get started with deployments.</p>
                    <Link to="/projects/new" className="btn btn-primary">
                      Create Project
                    </Link>
                  </>
                )}
              </div>
            )}

            {!projectsLoading && !projectsError && filteredProjects.length > 0 && (
              viewMode === 'grid' ? (
                <div className="project-grid">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="project-list-view">
                  {filteredProjects.map((project) => (
                    <ProjectListItem key={project.id} project={project} />
                  ))}
                </div>
              )
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Project Card (Grid View) ────────────────────────────
function ProjectCard({ project }: { project: ProjectWithDeployment }) {
  const dep = project.latestDeployment;

  return (
    <Link to={`/projects/${project.id}`} className="project-card">
      <div className="project-card-header">
        <div className="project-icon">
          {project.framework ? (
            <FrameworkIcon framework={project.framework} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            </svg>
          )}
        </div>
        <div className="project-card-title-group">
          <span className="project-name">{project.name}</span>
          {dep?.cdnUrl && (
            <span className="project-domain">{extractDomain(dep.cdnUrl)}</span>
          )}
        </div>
        <button
          className="project-card-more"
          onClick={(e) => e.preventDefault()}
          aria-label="More options"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      <div className="project-card-meta">
        <div className="meta-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          <span className="meta-text">{extractRepoName(project.repoUrl)}</span>
        </div>
      </div>

      {dep && (
        <div className="project-card-deployment">
          <DeploymentStatusBadge status={dep.status} />
          <span className="project-card-deploy-time">{formatRelativeTime(dep.createdAt)}</span>
        </div>
      )}

      <div className="project-card-footer">
        {dep?.commitHash && (
          <span className="project-commit">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <line x1="1.05" y1="12" x2="7" y2="12" />
              <line x1="17.01" y1="12" x2="22.96" y2="12" />
            </svg>
            {dep.commitHash.slice(0, 7)}
          </span>
        )}
        <span className="project-card-date">{formatRelativeTime(project.createdAt)}</span>
      </div>
    </Link>
  );
}

// ─── Project List Item (List View) ───────────────────────
function ProjectListItem({ project }: { project: ProjectWithDeployment }) {
  const dep = project.latestDeployment;

  return (
    <Link to={`/projects/${project.id}`} className="project-list-item">
      <div className="project-list-left">
        <div className="project-icon project-icon-sm">
          {project.framework ? (
            <FrameworkIcon framework={project.framework} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            </svg>
          )}
        </div>
        <div className="project-list-info">
          <span className="project-name">{project.name}</span>
          <span className="meta-text">{extractRepoName(project.repoUrl)}</span>
        </div>
      </div>
      <div className="project-list-center">
        {dep && <DeploymentStatusBadge status={dep.status} />}
      </div>
      <div className="project-list-right">
        <span className="project-card-date">{formatRelativeTime(project.createdAt)}</span>
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
      className="status-dot"
      style={{ backgroundColor: colors[status] || colors.pending }}
    />
  );
}

function FrameworkIcon({ framework }: { framework: string }) {
  // Simple text-based icon for framework
  const initial = framework.charAt(0).toUpperCase();
  return (
    <span className="framework-icon-text" title={framework}>
      {initial}
    </span>
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

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
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

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
