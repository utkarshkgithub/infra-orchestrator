import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { createProject } from '../../lib/api';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!repoUrl.trim()) {
      setError('Repository URL is required');
      return;
    }

    try {
      new URL(repoUrl);
      if (!repoUrl.includes('github.com')) {
        setError('Repository must be from github.com');
        return;
      }
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      const project = await createProject({ name, repoUrl });
      navigate(`/dashboard/project/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container page-container-sm">
        <div className="page-header">
          <div>
            <h1 className="page-title">New Project</h1>
            <p className="page-description">Import a GitHub repository to deploy</p>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label className="form-label" htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              type="text"
              className="form-input"
              placeholder="my-website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <span className="form-hint">A unique name for your project</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="repo-url">GitHub Repository</label>
            <input
              id="repo-url"
              type="url"
              className="form-input"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <span className="form-hint">Must be a public GitHub repository</span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loader-spinner loader-sm" />
                  Creating…
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
