import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDeploymentDetails, type Deployment } from '../../lib/api';

export default function DeploymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deploymentId = Number(id);

  const {
    data: deployment,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['deployment', deploymentId],
    queryFn: () => getDeploymentDetails(deploymentId),
    enabled: Number.isFinite(deploymentId),
    staleTime: 15_000,
    refetchInterval: (query) => {
      const deployment = query.state.data;
      return deployment?.status === 'pending' || deployment?.status === 'building'
        ? 5_000
        : false;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="state-container">
            <div className="loader-spinner" />
            <p className="state-text">Loading deployment…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !deployment) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="state-container">
            <div className="error-icon">!</div>
            <p className="state-text">{error instanceof Error ? error.message : 'Deployment not found'}</p>
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
        <nav className="breadcrumb">
          <Link to="/projects" className="breadcrumb-link">Projects</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to={`/projects/${deployment.projectId}`} className="breadcrumb-link">
            Project #{deployment.projectId}
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Deployment #{deployment.id}</span>
        </nav>

        <div className="page-header">
          <div>
            <h1 className="page-title">Deployment #{deployment.id}</h1>
            <p className="page-description">
              <StatusBadge status={deployment.status} />
              <span style={{ marginLeft: 8 }}>
                Created {formatDateTime(deployment.createdAt)}
              </span>
            </p>
          </div>
          {deployment.cdnUrl && (
            <a
              href={deployment.cdnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Visit Site
            </a>
          )}
        </div>

        {/* Deployment Info Cards */}
        <div className="detail-grid">
          <InfoCard label="Status" value={deployment.status.toUpperCase()} />
          <InfoCard label="Public ID" value={deployment.publicId} mono />
          <InfoCard label="Created" value={formatDateTime(deployment.createdAt)} />
          <InfoCard label="Updated" value={formatDateTime(deployment.updatedAt)} />
          {deployment.commitHash && (
            <InfoCard label="Commit" value={deployment.commitHash.slice(0, 8)} mono />
          )}
          {deployment.cdnUrl && (
            <InfoCard label="CDN URL" value={deployment.cdnUrl} mono />
          )}
        </div>

        {/* Build Logs */}
        {deployment.logs && (
          <div className="logs-section">
            <h3 className="section-title">Build Logs</h3>
            <pre className="logs-pre">{deployment.logs}</pre>
          </div>
        )}

        {/* Building animation */}
        {(deployment.status === 'pending' || deployment.status === 'building') && (
          <div className="building-indicator">
            <div className="building-dots">
              <span className="building-dot" />
              <span className="building-dot" />
              <span className="building-dot" />
            </div>
            <p>
              {deployment.status === 'pending'
                ? 'Waiting for build worker…'
                : 'Build in progress…'}
            </p>
            <span className="building-hint">This page auto-refreshes every 5 seconds</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="info-card">
      <span className="info-label">{label}</span>
      <span className={`info-value ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
