/**
 * Sidebar navigation — extracted from the monolithic DashboardLayout.
 * Responsible only for: logo, nav links, new-project button, account menu.
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  IconChevronDown,
  IconDeploy,
  IconFolders,
  IconLogout,
  IconLogo,
  IconPlus,
  IconUser,
  IconX,
} from "../ui/icons";
import ThemeToggle from "./ThemeToggle";
import { useClickOutside } from "../../hooks/useClickOutside";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false));

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const navLink = (to: string, icon: React.ReactNode, label: string) => (
    <Link
      to={to}
      onClick={onClose}
      className={[
        "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg no-underline transition-all duration-150",
        isActive(to)
          ? "text-black dark:text-d-fg bg-neutral-200/70 dark:bg-d-200 font-semibold"
          : "text-neutral-500 dark:text-d-500 font-medium hover:text-black dark:hover:text-d-fg hover:bg-neutral-100 dark:hover:bg-d-100",
      ].join(" ")}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Top section */}
      <div className="flex flex-col gap-1 px-3 pt-4 pb-3">
        {/* Logo row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <Link
            to="/projects"
            onClick={onClose}
            className="flex items-center gap-2 font-bold text-[15px] text-black dark:text-d-fg no-underline tracking-tight"
          >
            <IconLogo size={22} />
            <span>shipwebsite</span>
          </Link>
          {/* Close btn — mobile only */}
          {onClose && (
            <button
              className="flex md:hidden items-center justify-center w-7 h-7 border-none bg-transparent text-neutral-500 dark:text-d-500 cursor-pointer rounded-md transition-colors hover:bg-neutral-200 dark:hover:bg-d-200 hover:text-black dark:hover:text-d-fg"
              onClick={onClose}
              aria-label="Close menu"
            >
              <IconX size={16} />
            </button>
          )}
        </div>

        {/* New Project CTA */}
        <button
          className="flex items-center gap-2 w-full px-3 py-2 text-[13px] font-semibold font-sans text-white dark:text-d-bg bg-black dark:bg-d-fg border border-transparent rounded-lg cursor-pointer transition-all duration-150 mb-2 hover:opacity-85"
          onClick={() => {
            onClose?.();
            navigate("/projects/new");
          }}
        >
          <IconPlus size={14} />
          New Project
        </button>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-neutral-400 dark:text-d-400 uppercase tracking-widest px-3 pt-2 pb-1">
            Navigate
          </span>
          {navLink("/projects", <IconFolders size={16} />, "Projects")}
          {navLink("/deployments", <IconDeploy size={16} />, "Deployments")}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-1 p-3 border-t border-neutral-200 dark:border-d-200">
        <ThemeToggle />

        {/* Account menu */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-2.5 w-full p-2 border-none bg-transparent rounded-lg cursor-pointer transition-all duration-150 text-black dark:text-d-fg font-sans hover:bg-neutral-100 dark:hover:bg-d-100"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.login}
                className="w-[30px] h-[30px] rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-[30px] h-[30px] rounded-full bg-neutral-200 dark:bg-d-200 flex items-center justify-center text-neutral-500 dark:text-d-500 shrink-0">
                <IconUser size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col text-left">
              <span className="text-[13px] font-medium text-black dark:text-d-fg truncate">
                {user?.login ?? "User"}
              </span>
              <span className="text-[11px] text-neutral-400 dark:text-d-400 truncate">
                {user?.email ?? ""}
              </span>
            </div>
            <IconChevronDown
              size={14}
              className={`text-neutral-400 shrink-0 transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-d-bg border border-neutral-200 dark:border-d-200 rounded-xl shadow-xl p-1 animate-dropdown-in">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] font-sans text-neutral-700 dark:text-d-700 bg-transparent border-none rounded-md cursor-pointer transition-all duration-150 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
              >
                <IconLogout size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
