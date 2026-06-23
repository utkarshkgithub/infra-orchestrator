import { useEffect, useState } from 'react'
import { getGithubAuthUrl } from '../../lib/api'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const githubAuthUrl = getGithubAuthUrl()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      id="main-nav"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-[rgba(232,230,225,0.06)] bg-[rgba(8,9,14,0.85)] py-3 backdrop-blur-xl'
          : 'py-5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 sm:px-8 lg:px-10">
        {/* Logo */}
        <a
          href="/"
          id="nav-logo"
          className="inline-flex shrink-0 items-center gap-2.5 font-sans text-[0.9375rem] font-semibold tracking-[-0.02em] text-bone"
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" className="text-phosphor">
            <path d="M16 4L6 24h8v4l12-20h-8V4z" fill="currentColor" />
          </svg>
          <span>
            ship<span className="text-phosphor">website</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center gap-8 lg:flex">
          <a href="#process" className="text-sm text-ash transition-colors duration-200 hover:text-bone">
            Process
          </a>
          <a href="#features" className="text-sm text-ash transition-colors duration-200 hover:text-bone">
            Features
          </a>
          {/* <a href="#pricing" className="text-sm text-ash transition-colors duration-200 hover:text-bone">
            Pricing
          </a> */}
        </div>

        {/* Desktop CTA */}
        <div className="ml-auto flex items-center gap-5">
          <a
            href={githubAuthUrl}
            className="hidden items-center justify-center gap-2 rounded-lg bg-gray-200 px-5 py-2 font-sans text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(200,255,60,0.3)] sm:inline-flex"
          >
            <GithubIcon />
            Continue with GitHub
          </a>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(232,230,225,0.08)] text-ash lg:hidden"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {mobileOpen ? (
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M2 5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 9h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[rgba(232,230,225,0.06)] bg-[rgba(8,9,14,0.95)] px-6 pb-6 pt-4 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-4">
            <a href="#process" onClick={() => setMobileOpen(false)} className="text-sm text-ash transition-colors hover:text-bone">
              Process
            </a>
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm text-ash transition-colors hover:text-bone">
              Features
            </a>
            {/* <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm text-ash transition-colors hover:text-bone">
              Pricing
            </a> */}
            <div className="mt-2 flex flex-col gap-3 border-t border-[rgba(232,230,225,0.06)] pt-4">
              <a
                href={githubAuthUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-phosphor px-5 py-2.5 text-center font-sans text-sm font-semibold text-void"
              >
                <GithubIcon />
                Continue with GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function GithubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.49 11.49 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.799 24 17.302 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}
