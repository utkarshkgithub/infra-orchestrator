import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect, useRef, type ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when sidebar overlay is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="flex min-h-screen font-sans text-black dark:text-d-fg bg-white dark:bg-d-bg antialiased">
      {/* Mobile top bar */}
      <header className="flex md:!hidden items-center justify-between px-4 h-[52px] bg-white dark:bg-d-bg border-b border-neutral-200 dark:border-d-200 sticky top-0 z-[100]">
        <button
          className="flex items-center justify-center w-9 h-9 border-none bg-transparent text-black dark:text-d-fg cursor-pointer rounded-md transition-all duration-150 hover:bg-neutral-100 dark:hover:bg-d-100"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link
          to="/projects"
          onClick={() => setSidebarOpen(false)}
          className="inline-flex items-center gap-1.5 font-semibold text-[15px] text-black dark:text-d-fg no-underline"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <polyline points="22 8.5 12 15.5 2 8.5" />
          </svg>
          <span>shipwebsite</span>
        </Link>
        <div style={{ width: 32 }} /> {/* spacer for centering */}
      </header>

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[190] animate-fade-in md:!hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[280px] md:w-[260px] bg-neutral-50 dark:bg-d-sidebar border-r border-neutral-200 dark:border-d-sidebar-border flex flex-col justify-between z-[200] overflow-y-auto transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarOpen ? "translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)]" : "-translate-x-full"} md:translate-x-0 md:shadow-none`}
      >
        <div className="flex flex-col gap-1 px-3 pt-4 pb-3">
          {/* Logo */}
          <div className="flex items-center justify-between mb-3 px-1">
            <Link
              to="/projects"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 font-semibold text-[15px] text-black dark:text-d-fg no-underline"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <polyline points="22 8.5 12 15.5 2 8.5" />
              </svg>
              <span>shipwebsite</span>
            </Link>
            {/* Close button for mobile */}
            <button
              className="flex md:hidden items-center justify-center w-7 h-7 border-none bg-transparent text-neutral-500 dark:text-d-500 cursor-pointer rounded-md transition-all duration-150 hover:bg-neutral-200 dark:hover:bg-d-200 hover:text-black dark:hover:text-d-fg"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* New Project button */}
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] font-medium font-sans text-white dark:text-d-bg bg-black dark:bg-d-fg border border-transparent rounded-lg cursor-pointer transition-all duration-150 mb-2 hover:opacity-85"
            onClick={() => {
              setSidebarOpen(false);
              navigate("/projects/new");
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>

          {/* Navigation */}
          <nav className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-400 dark:text-d-400 uppercase tracking-[0.06em] px-3 pt-2 pb-1">
              Navigate
            </span>
            <Link
              to="/projects"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-[450] no-underline rounded-lg transition-all duration-150 ${isActive("/projects") ? "text-black dark:text-d-fg bg-neutral-200 dark:bg-d-200 font-medium" : "text-neutral-500 dark:text-d-500 hover:text-black dark:hover:text-d-fg hover:bg-neutral-100 dark:hover:bg-d-100"}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Projects
            </Link>
            <Link
              to="/deployments"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-[450] no-underline rounded-lg transition-all duration-150 ${isActive("/deployments") ? "text-black dark:text-d-fg bg-neutral-200 dark:bg-d-200 font-medium" : "text-neutral-500 dark:text-d-500 hover:text-black dark:hover:text-d-fg hover:bg-neutral-100 dark:hover:bg-d-100"}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              Deployments
            </Link>
          </nav>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col gap-1 p-3 border-t border-neutral-200 dark:border-d-200">
          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2.5 w-full p-2 border-none bg-transparent rounded-lg cursor-pointer transition-all duration-150 text-black dark:text-d-fg font-sans hover:bg-neutral-100 dark:hover:bg-d-100"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Account menu"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className="w-[30px] h-[30px] rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-[30px] h-[30px] rounded-full bg-neutral-200 dark:bg-d-200 flex items-center justify-center text-neutral-500 dark:text-d-500 shrink-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <span className="text-[13px] font-medium text-black dark:text-d-fg overflow-hidden text-ellipsis whitespace-nowrap">
                  {user?.login || "User"}
                </span>
                <span className="text-[11px] text-neutral-400 dark:text-d-400 overflow-hidden text-ellipsis whitespace-nowrap">
                  {user?.email || ""}
                </span>
              </div>
              <svg
                className="text-neutral-400 dark:text-d-400 shrink-0 transition-transform duration-150"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-d-bg border border-neutral-200 dark:border-d-200 rounded-lg shadow-lg p-1 animate-dropdown-in">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] font-sans text-neutral-700 dark:text-d-700 bg-transparent border-none rounded-md cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-0 md:ml-[260px] flex-1 min-h-screen min-w-0">
        {children}
      </main>
    </div>
  );
}
