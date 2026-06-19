import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  getProjectDetails,
  createDeployment,
  getProjectDeployments,
  updateProject,
  type Project,
  type Deployment,
} from '../../lib/api';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'deployments' | 'settings'>('deployments');

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: Number.isFinite(projectId),
    staleTime: 60_000,
  });

  const deploymentsQuery = useQuery({
    queryKey: ['projectDeployments', projectId],
    queryFn: () => getProjectDeployments(projectId),
    enabled: Number.isFinite(projectId),
    staleTime: 15_000,
  });

  const deployMutation = useMutation({
    mutationFn: () => createDeployment(projectId),
    onSuccess: (deployment) => {
      queryClient.setQueryData<Deployment[]>(
        ['projectDeployments', projectId],
        (current = []) => [deployment, ...current],
      );
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      alert(err instanceof Error ? err.message : 'Deployment failed');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="state-container">
            <div className="loader-spinner" />
            <p className="state-text">Loading project…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="state-container">
            <div className="error-icon">!</div>
            <p className="state-text">{error instanceof Error ? error.message : 'Project not found'}</p>
            <Link to="/projects" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/projects" className="breadcrumb-link">Projects</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{project.name}</span>
        </nav>

        {/* Project Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-description">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                {extractRepoName(project.repoUrl)}
              </a>
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleDeploy}
            disabled={deployMutation.isPending}
          >
            {deployMutation.isPending ? (
              <>
                <div className="loader-spinner loader-sm" />
                Deploying…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'deployments' ? 'active' : ''}`}
            onClick={() => setActiveTab('deployments')}
          >
            Deployments
            {deployments.length > 0 && (
              <span className="tab-count">{deployments.length}</span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'deployments' && (
          <DeploymentsTab deployments={deployments} project={project} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            project={project}
            onUpdate={(updated) => {
              queryClient.setQueryData(['project', projectId], updated);
              queryClient.invalidateQueries({ queryKey: ['projects'] });
            }}
          />
        )}
      </div>
    </DashboardLayout>
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
      <div className="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        <h3>No deployments yet</h3>
        <p>Click "Deploy" to trigger your first build.</p>
      </div>
    );
  }

  return (
    <div className="deployments-list">
      {deployments.map((dep) => (
        <div key={dep.id} className="deployment-row">
          <div className="deployment-info">
            <div className="deployment-header-row">
              <StatusBadge status={dep.status} />
              <span className="deployment-id">#{dep.id}</span>
              {dep.publicId && (
                <span className="deployment-public-id">{dep.publicId.slice(0, 8)}</span>
              )}
            </div>
            <div className="deployment-meta">
              <span>{project.name}</span>
              <span className="dot">·</span>
              <span>{formatDateTime(dep.createdAt)}</span>
            </div>
          </div>
          <div className="deployment-actions">
            {dep.cdnUrl && (
              <a
                href={dep.cdnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Visit
              </a>
            )}
            <Link
              to={`/deployments/${dep.id}`}
              className="btn btn-secondary btn-sm"
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
    framework: project.framework || '',
  });
  const [envText, setEnvText] = useState(
    Object.entries(project.envVars || {})
      .map(([k, v]) => `${k}=${v}`)
      .join('\n'),
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
      // Parse env vars
      const envVars: Record<string, string> = {};
      envText
        .split('\n')
        .filter((line) => line.includes('='))
        .forEach((line) => {
          const idx = line.indexOf('=');
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
    } catch (err: any) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-card settings-form" onSubmit={handleSave}>
      {error && (
        <div className="form-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="form-success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Settings saved successfully
        </div>
      )}

      <div className="form-section">
        <h3 className="form-section-title">General</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="s-name">Project Name</label>
            <input
              id="s-name"
              className="form-input"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="s-repo">Repository URL</label>
            <input
              id="s-repo"
              className="form-input"
              value={form.repoUrl}
              onChange={(e) => handleChange('repoUrl', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Build Configuration</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="s-root">Root Directory</label>
            <input
              id="s-root"
              className="form-input"
              value={form.rootDir}
              onChange={(e) => handleChange('rootDir', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="s-framework">Framework</label>
            <input
              id="s-framework"
              className="form-input"
              placeholder="Auto-detected"
              value={form.framework}
              onChange={(e) => handleChange('framework', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="s-install">Install Command</label>
            <input
              id="s-install"
              className="form-input font-mono"
              value={form.installCmd}
              onChange={(e) => handleChange('installCmd', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="s-build">Build Command</label>
            <input
              id="s-build"
              className="form-input font-mono"
              value={form.buildCmd}
              onChange={(e) => handleChange('buildCmd', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="s-output">Output Directory</label>
            <input
              id="s-output"
              className="form-input font-mono"
              value={form.outputDir}
              onChange={(e) => handleChange('outputDir', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Environment Variables</h3>
        <p className="form-section-desc">One per line, in KEY=VALUE format</p>
        <textarea
          className="form-textarea font-mono"
          rows={6}
          placeholder="NEXT_PUBLIC_API_URL=https://api.example.com&#10;NODE_ENV=production"
          value={envText}
          onChange={(e) => setEnvText(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="loader-spinner loader-sm" />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Shared Components ───────────────────────────────────
function StatusBadge({ status }: { status: Deployment['status'] }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'badge badge-pending' },
    building: { label: 'Building', className: 'badge badge-building' },
    success: { label: 'Ready', className: 'badge badge-success' },
    failed: { label: 'Failed', className: 'badge badge-failed' },
    cancelled: { label: 'Cancelled', className: 'badge badge-cancelled' },
  };
  const c = config[status] || config.pending;
  return <span className={c.className}>{c.label}</span>;
}

function extractRepoName(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : url;
  } catch {
    return url;
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
