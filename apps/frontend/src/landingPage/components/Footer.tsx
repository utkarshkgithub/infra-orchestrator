import { getGithubAuthUrl } from '../../lib/api'

export default function Footer() {
  const githubAuthUrl = getGithubAuthUrl()

  return (
    <footer className="border-t border-[rgba(232,230,225,0.05)] py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Top: CTA banner */}
        <div className="mb-20 rounded-2xl border border-[rgba(200,255,60,0.1)] bg-[rgba(200,255,60,0.03)] px-8 py-14 text-center sm:px-12">
          <h2 className="mb-4 font-serif text-[clamp(1.75rem,4vw,2.75rem)] text-bone">
            Ready to <em className="text-phosphor" style={{ fontStyle: 'italic' }}>ship</em>?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-[0.9375rem] leading-7 text-ash">
            Deploy your first site in under a minute. No credit card, no config files, no friction.
          </p>
          <a href={githubAuthUrl} id="footer-cta" className="inline-flex items-center justify-center gap-2 rounded-xl bg-phosphor px-8 py-3.5 font-sans text-[0.9375rem] font-semibold tracking-[-0.01em] text-void transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,255,60,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-4 focus-visible:ring-offset-void">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.49 11.49 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.799 24 17.302 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </a>
        </div>

        {/* Mid: Links */}
        <div className="mb-16 grid gap-12 lg:grid-cols-[1.5fr_2fr]">
          <div>
            <a href="/" className="mb-4 inline-flex items-center gap-2 font-sans text-[0.9375rem] font-semibold tracking-[-0.02em] text-bone">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M16 4L6 24h8v4l12-20h-8V4z" fill="#C8FF3C" />
              </svg>
              <span>
                ship<span className="text-phosphor">website</span>
              </span>
            </a>
            <p className="max-w-sm text-sm leading-7 text-ash">
              A simplified deployment system for static builds. Designed to stay out of your way.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3">
              <span className="mb-1 font-sans text-sm font-semibold tracking-[-0.01em] text-bone">Product</span>
              <a href="#process" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Process</a>
              <a href="#features" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Features</a>
              <a href="#pricing" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Pricing</a>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Changelog</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="mb-1 font-sans text-sm font-semibold tracking-[-0.01em] text-bone">Developers</span>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Documentation</a>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">CLI reference</a>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">API</a>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">GitHub</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="mb-1 font-sans text-sm font-semibold tracking-[-0.01em] text-bone">Company</span>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">About</a>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Blog</a>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Status</a>
              <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Contact</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-[rgba(232,230,225,0.05)] pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-ash">© 2024 shipwebsite.tech</p>
          <div className="flex items-center justify-center gap-6 sm:justify-start">
            <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Privacy</a>
            <a href="/" className="text-sm text-ash transition-colors duration-200 hover:text-bone">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
