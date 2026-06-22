import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { createProject } from '../../lib/api';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/projects/${project.id}`);
    },
  });

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

    try {
      await createProjectMutation.mutateAsync({ name, repoUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[640px] mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-d-fg m-0">New Project</h1>
            <p className="text-sm text-neutral-500 dark:text-d-500 mt-1 m-0">Import a GitHub repository to deploy</p>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          {error && (
            <div className="form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
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
              onClick={() => navigate('/projects')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin-fast opacity-70" />
                  Creating…
                </>
              ) : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
