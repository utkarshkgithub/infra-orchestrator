import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDeployments, type Deployment } from '../../lib/api';

export default function DeploymentsListPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDeployments();
        setDeployments(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load deployments');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Deployments</h1>
            <p className="page-description">All deployments across your projects</p>
          </div>
        </div>

        {loading && (
          <div className="state-container">
            <div className="loader-spinner" />
            <p className="state-text">Loading deployments…</p>
          </div>
        )}

        {error && (
          <div className="state-container">
            <div className="error-icon">!</div>
            <p className="state-text">{error}</p>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && deployments.length === 0 && (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <h3>No deployments yet</h3>
            <p>Create a project and trigger your first deployment.</p>
            <Link to="/dashboard/new" className="btn btn-primary">
              Create Project
            </Link>
          </div>
        )}

        {!loading && !error && deployments.length > 0 && (
          <div className="deployments-list">
            {deployments.map((dep) => (
              <Link
                key={dep.id}
                to={`/dashboard/deployment/${dep.id}`}
                className="deployment-row deployment-row-link"
              >
                <div className="deployment-info">
                  <div className="deployment-header-row">
                    <StatusBadge status={dep.status} />
                    <span className="deployment-id">#{dep.id}</span>
                    <span className="deployment-public-id">{dep.publicId.slice(0, 8)}</span>
                  </div>
                  <div className="deployment-meta">
                    <span>Project #{dep.projectId}</span>
                    <span className="dot">·</span>
                    <span>{formatDateTime(dep.createdAt)}</span>
                  </div>
                </div>
                <div className="deployment-actions">
                  {dep.cdnUrl && (
                    <span className="btn btn-secondary btn-sm" onClick={(e) => {
                      e.preventDefault();
                      window.open(dep.cdnUrl!, '_blank');
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Visit
                    </span>
                  )}
                  <span className="btn btn-secondary btn-sm">
                    Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
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
