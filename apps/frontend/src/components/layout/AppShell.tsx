/**
 * AppShell — the root layout shell for all authenticated pages.
 * Composes Sidebar + mobile top bar + main content area.
 * Replaces the 313-line monolithic DashboardLayout.tsx.
 */

import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { IconMenu, IconLogo } from "../ui/icons";

interface AppShellProps {
  children: ReactNode;
}

const SIDEBAR_WIDTH = 260;

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const close = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen font-sans text-black dark:text-d-fg bg-white dark:bg-d-bg antialiased">

      {/* ── Mobile top bar ─────────────────────────────────────── */}
      <header
        className="flex md:hidden items-center justify-between px-4 h-[52px] bg-white dark:bg-d-bg border-b border-neutral-200 dark:border-d-200 sticky top-0 z-[100]"
        aria-label="Mobile navigation"
      >
        <button
          className="flex items-center justify-center w-9 h-9 border-none bg-transparent text-black dark:text-d-fg cursor-pointer rounded-md transition-all hover:bg-neutral-100 dark:hover:bg-d-100"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-nav"
        >
          <IconMenu size={20} />
        </button>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 font-bold text-[15px] text-black dark:text-d-fg no-underline"
        >
          <IconLogo size={20} />
          shipwebsite
        </Link>
        <div style={{ width: 36 }} aria-hidden />
      </header>

      {/* ── Backdrop (mobile) ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[190] animate-fade-in md:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        id="sidebar-nav"
        className={[
          "fixed top-0 left-0 bottom-0 bg-neutral-50 dark:bg-d-sidebar border-r border-neutral-200 dark:border-d-sidebar-border z-[200] overflow-y-auto transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          `w-[280px] md:w-[${SIDEBAR_WIDTH}px]`,
          sidebarOpen
            ? "translate-x-0 shadow-[4px_0_32px_rgba(0,0,0,0.18)]"
            : "-translate-x-full md:translate-x-0 md:shadow-none",
        ].join(" ")}
        aria-label="Sidebar navigation"
      >
        <Sidebar onClose={close} />
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <main
        className="flex-1 min-h-screen min-w-0"
        style={{ marginLeft: 0 }}
      >
        {/* Desktop sidebar offset via CSS variable approach — avoids style= on every page */}
        <div className="md:ml-[260px]">
          {children}
        </div>
      </main>
    </div>
  );
}
