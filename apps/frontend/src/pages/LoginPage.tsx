import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGithubAuthUrl } from '../lib/api';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = () => {
    window.location.href = getGithubAuthUrl();
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-12 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10">
        <div className="max-w-2xl">
          <Link to="/" className="inline-flex items-center gap-3 text-black">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-sm">
              SW
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold tracking-[-0.02em]">shipwebsite</span>
              <span className="text-xs text-zinc-500">GitHub auth to dashboard</span>
            </span>
          </Link>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-black/10 bg-zinc-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-black" />
            Secure session flow
          </div>

          <h1 className="mt-7 max-w-2xl text-5xl font-semibold tracking-[-0.06em] text-black sm:text-6xl">
            Sign in with GitHub to reach your dashboard.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
            The backend sets a secure session cookie, redirects you back to the app, and the dashboard loads your projects and deployments from there.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              'httpOnly session cookie',
              'project settings prefill',
              'deployment logs + CDN URL',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-black">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-4xl bg-black/5" aria-hidden="true" />
          <div className="relative rounded-4xl border border-black/10 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Login</p>
                <p className="mt-1 text-sm font-medium text-black">Continue with GitHub</p>
              </div>
              <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-zinc-600">
                secure
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-black">What happens next</p>
              <ol className="mt-4 space-y-3 text-sm text-zinc-600">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                    1
                  </span>
                  GitHub OAuth authenticates the user and issues the session cookie.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                    2
                  </span>
                  The callback redirects back to /dashboard with the cookie already set.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                    3
                  </span>
                  Projects and deployments are fetched with the authenticated session.
                </li>
              </ol>
            </div>

            <button
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-[0_12px_36px_rgba(0,0,0,0.16)]"
              onClick={handleLogin}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            <div className="mt-6 flex items-center justify-between gap-4 text-xs text-zinc-500">
              <Link to="/" className="transition-colors hover:text-black">
                Back to site
              </Link>
              <span>GitHub OAuth handled by the backend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
