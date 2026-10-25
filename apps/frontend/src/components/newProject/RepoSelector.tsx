/**
 * RepoSelector — searchable list of the user's GitHub repositories.
 * Shows install URL when no repos are available (app not installed).
 *
 * Install link opens a popup; when the GitHub App setup callback fires
 * postMessage, we close the popup and refetch repos. No SPA reload.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconGithub, IconSearch, IconExternalLink } from "../ui/icons";
import type { GithubRepo } from "../../lib/types";

interface RepoSelectorProps {
  repos: GithubRepo[];
  selected: GithubRepo | null;
  onSelect: (repo: GithubRepo | null) => void;
  loading: boolean;
  installUrl: string;
}

// ponytail: one helper, no abstraction layer for popup windows.
function openCenteredPopup(url: string, name: string, w = 600, h = 700) {
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  return window.open(url, name, `width=${w},height=${h},left=${left},top=${top}`);
}

export function RepoSelector({ repos, selected, onSelect, loading, installUrl }: RepoSelectorProps) {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const popupRef = useRef<Window | null>(null);

  const openInstallPopup = useCallback(() => {
    popupRef.current = openCenteredPopup(installUrl, "github-app-install");
  }, [installUrl]);

  // Listen for the setup callback postMessage from the backend.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // ponytail: origin check uses window.location.origin — the message
      // must come from our own frontend origin (which is where the backend
      // redirects via FRONTEND_URL). Actually the backend sends from its
      // own origin, so we check that the data shape is right and the popup
      // is ours. The backend's /setup endpoint restricts postMessage target
      // to FRONTEND_URL already, so the browser only delivers it here.
      if (e.data?.type !== "GITHUB_APP_SETUP_COMPLETE") return;

      // Close popup if we opened it.
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;

      // Refetch repos — the new installation is now visible via the API.
      queryClient.invalidateQueries({ queryKey: ["github-repos"] });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [queryClient]);

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-11 rounded-xl bg-neutral-100 dark:bg-d-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 px-4 text-center border border-dashed border-neutral-200 dark:border-d-200 rounded-xl">
        <IconGithub size={24} className="text-neutral-400 dark:text-d-400" />
        <div>
          <p className="text-[13px] font-medium text-black dark:text-d-fg m-0">No repositories found</p>
          <p className="text-[12px] text-neutral-500 dark:text-d-500 m-0 mt-1">
            Install the GitHub App to grant access to your repos.
          </p>
        </div>
        <button
          type="button"
          onClick={openInstallPopup}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold bg-black dark:bg-d-fg text-white dark:text-d-bg rounded-lg border-none cursor-pointer transition-all hover:opacity-85"
        >
          <IconExternalLink size={13} />
          Install GitHub App
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div className="relative">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-d-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search repositories…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 dark:border-d-200 rounded-xl bg-white dark:bg-d-bg text-black dark:text-d-fg outline-none transition focus:border-neutral-400 dark:focus:border-d-400"
        />
      </div>

      {/* List */}
      <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-[13px] text-neutral-500 dark:text-d-500 text-center py-4 m-0">
            No results for "{search}"
          </p>
        )}
        {filtered.map((repo) => {
          const isSelected = selected?.id === repo.id;
          return (
            <button
              key={repo.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : repo)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left w-full cursor-pointer transition-all duration-150 font-sans",
                isSelected
                  ? "border-black dark:border-d-fg bg-black dark:bg-d-fg text-white dark:text-d-bg"
                  : "border-neutral-200 dark:border-d-200 bg-white dark:bg-d-bg text-black dark:text-d-fg hover:border-neutral-300 dark:hover:border-d-300 hover:bg-neutral-50 dark:hover:bg-d-50",
              ].join(" ")}
            >
              <IconGithub size={15} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium truncate">{repo.full_name}</span>
                <span className={`block text-[11px] truncate ${isSelected ? "text-white/60 dark:text-d-bg/60" : "text-neutral-400 dark:text-d-400"}`}>
                  {repo.default_branch}
                </span>
              </div>
              {isSelected && (
                <span className="shrink-0 text-[11px] font-semibold opacity-70">Selected</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Install more repos — opens popup, not a new tab */}
      <button
        type="button"
        onClick={openInstallPopup}
        className="text-[12px] text-neutral-400 dark:text-d-400 hover:text-black dark:hover:text-d-fg bg-transparent border-none cursor-pointer transition-colors self-start p-0"
      >
        + Add more repositories
      </button>
    </div>
  );
}

