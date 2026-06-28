import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  createProject,
  type GithubRepo,
  type DashboardData,
  type CreateProjectInput,
} from "../../lib/api";
import { useGithubRepos } from "../../lib/hooks/useGithubRepos";

// Framework definitions
interface FrameworkDef {
  /** Value sent to the API  */
  id: string;
  label: string;
  installCmd: string;
  buildCmd: string;
  /** Suffix after the locked "./" prefix */
  outputDirSuffix: string;
  icon: React.ReactNode;
}

const FRAMEWORKS: FrameworkDef[] = [
  {
    id: "react",
    label: "React (Vite)",
    installCmd: "npm install",
    buildCmd: "npm run build",
    outputDirSuffix: "dist",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <circle cx="12" cy="12" r="2.5" fill="#61DAFB" />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          stroke="#61DAFB"
          strokeWidth="1.2"
          fill="none"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          stroke="#61DAFB"
          strokeWidth="1.2"
          fill="none"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          stroke="#61DAFB"
          strokeWidth="1.2"
          fill="none"
          transform="rotate(120 12 12)"
        />
      </svg>
    ),
  },
  {
    id: "vue",
    label: "Vue (Vite)",
    installCmd: "npm install",
    buildCmd: "npm run build",
    outputDirSuffix: "dist",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <path d="M2 4l10 17L22 4h-4l-6 10L8 4z" fill="#42B883" />
        <path d="M8 4l4 7 4-7h-3l-1 2-1-2z" fill="#35495E" />
      </svg>
    ),
  },
  {
    id: "angular",
    label: "Angular",
    installCmd: "npm install",
    buildCmd: "npm run build",
    outputDirSuffix: "dist",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <path d="M12 2L3 5.5l1.5 12.5L12 22l7.5-4L21 5.5z" fill="#DD0031" />
        <path d="M12 2v20l7.5-4L21 5.5z" fill="#C3002F" />
        <path d="M12 5.5L8 16h1.5l.75-2h3.5l.75 2H16z" fill="white" />
        <path d="M10.75 12.5l1.25-3 1.25 3z" fill="#DD0031" />
      </svg>
    ),
  },
  {
    id: "svelte",
    label: "Svelte",
    installCmd: "npm install",
    buildCmd: "npm run build",
    outputDirSuffix: "build",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <path
          d="M20.3 5.2C18.4 2.2 14.4 1.3 11.4 3.2L5.8 6.9c-1.4.9-2.4 2.3-2.7 3.9-.3 1.4-.1 2.8.6 4-.5.7-.8 1.5-.9 2.4-.2 1.6.3 3.3 1.5 4.4 1.9 3 5.9 3.9 8.9 2l5.6-3.7c1.4-.9 2.4-2.3 2.7-3.9.3-1.4.1-2.8-.6-4 .5-.7.8-1.5.9-2.4.2-1.6-.3-3.2-1.5-4.4z"
          fill="#FF3E00"
        />
        <path
          d="M10.7 19.8c-1.8.5-3.7-.2-4.7-1.8-.7-1-.9-2.2-.6-3.4l.1-.4.3.2c.7.4 1.5.7 2.3.9l.2.1-.1.2c-.1.5 0 1 .3 1.4.6.9 1.7 1.3 2.8 1 .3-.1.5-.2.7-.3l5.6-3.7c.4-.3.7-.7.8-1.2.1-.5 0-1-.3-1.4-.6-.9-1.7-1.3-2.8-1-.3.1-.5.2-.7.3L12 11.5c-.7.4-1.4.7-2.2.8-1.8.5-3.7-.2-4.7-1.8-.7-1-.9-2.2-.6-3.4.3-1.2 1.1-2.2 2.2-2.9L12 .5c.7-.4 1.4-.7 2.2-.8 1.8-.5 3.7.2 4.7 1.8.7 1 .9 2.2.6 3.4l-.1.4-.3-.2c-.7-.4-1.5-.7-2.3-.9l-.2-.1.1-.2c.1-.5 0-1-.3-1.4-.6-.9-1.7-1.3-2.8-1-.3.1-.5.2-.7.3L7.3 5.5c-.4.3-.7.7-.8 1.2-.1.5 0 1 .3 1.4.6.9 1.7 1.3 2.8 1 .3-.1.5-.2.7-.3l2.3-1.5c.7-.4 1.4-.7 2.2-.8 1.8-.5 3.7.2 4.7 1.8.7 1 .9 2.2.6 3.4-.3 1.2-1.1 2.2-2.2 2.9l-5.6 3.7c-.7.4-1.5.7-2.6.5z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "solid",
    label: "Solid",
    installCmd: "npm install",
    buildCmd: "npm run build",
    outputDirSuffix: "dist",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
          fill="#2C4F7C"
        />
        <path
          d="M7 8.5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2s-.9 2-2 2H9c-1.1 0-2-.9-2-2z"
          fill="#4FC08D"
        />
        <path
          d="M7 15.5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2s-.9 2-2 2H9c-1.1 0-2-.9-2-2z"
          fill="#76B3E1"
        />
      </svg>
    ),
  },
  {
    id: "astro",
    label: "Astro",
    installCmd: "npm install",
    buildCmd: "npm run build",
    outputDirSuffix: "dist",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <path
          d="M8.5 2s-.5 4 2 6.5c-.5-1 .5-3 2-4 .5 3 2 4.5 3.5 5.5 1 .5 2 2 2 3.5 0 4-3.5 7-8 7S2 17.5 2 13.5C2 9 5 5 8.5 2z"
          fill="url(#aGrad)"
        />
        <path
          d="M14 9.5c1.5 1 2.5 2.5 2.5 4 0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5c0-1 .3-1.9.8-2.7.5 1.2 1.7 2.2 3.2 2.7-.5-1.5-.2-3 2.5-4z"
          fill="white"
          opacity="0.7"
        />
        <defs>
          <linearGradient
            id="aGrad"
            x1="2"
            y1="2"
            x2="22"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FF5D01" />
            <stop offset="100%" stopColor="#FF1639" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: "next",
    label: "Next.js (static export only)",
    installCmd: "npm install",
    buildCmd: "npm run build",
    outputDirSuffix: "out",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <circle cx="12" cy="12" r="10" fill="black" />
        <path d="M8 8h1.5l5.5 8H13.5z" fill="white" />
        <path d="M14.5 8H16v8h-1.5z" fill="white" opacity="0.5" />
      </svg>
    ),
  },
];

const FRAMEWORK_MAP = Object.fromEntries(FRAMEWORKS.map((f) => [f.id, f]));

function FrameworkDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ? FRAMEWORK_MAP[value] : null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        id="framework-select"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm outline-none transition cursor-pointer",
          "bg-white dark:bg-zinc-950",
          open
            ? "border-zinc-900 dark:border-zinc-400"
            : "border-zinc-300 dark:border-zinc-700",
          "hover:border-zinc-500 dark:hover:border-zinc-500",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {selected ? (
            <>
              <span className="shrink-0">{selected.icon}</span>
              <span className="text-zinc-900 dark:text-zinc-100 truncate">
                {selected.label}
              </span>
            </>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500">
              Select a framework…
            </span>
          )}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          role="listbox"
          className={[
            "absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden",
            "animate-dropdown-in",
            isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200",
          ].join(" ")}
        >
          <div className="p-1">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.id}
                type="button"
                role="option"
                aria-selected={value === fw.id}
                onClick={() => {
                  onChange(fw.id);
                  setOpen(false);
                }}
                className={[
                  "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors cursor-pointer",
                  value === fw.id
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                ].join(" ")}
              >
                <span className="shrink-0">{fw.icon}</span>
                <span>{fw.label}</span>
                {value === fw.id && (
                  <svg
                    className="ml-auto shrink-0 text-zinc-500"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RootDirInput({
  suffix,
  onChange,
}: {
  suffix: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex items-center w-full rounded-xl border border-zinc-300 bg-white overflow-hidden transition focus-within:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-400">
      {/* Locked prefix */}
      <span className="px-3 py-2.5 text-sm font-mono text-zinc-400 dark:text-zinc-500 select-none border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 shrink-0">
        ./
      </span>

      {/* Editable suffix */}
      <input
        id="root-dir"
        type="text"
        value={suffix}
        onChange={(e) => {
          // Strip leading "./" or "/" or "." that the user might type
          const val = e.target.value.replace(/^[./]+/, "");
          onChange(val);
        }}
        className="flex-1 px-3 py-2.5 text-sm font-mono outline-none bg-transparent text-zinc-900 dark:text-zinc-100"
        placeholder="apps/web"
      />
    </div>
  );
}

function OutputDirInput({
  suffix,
  onChange,
}: {
  suffix: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex items-center w-full rounded-xl border border-zinc-300 bg-white overflow-hidden transition focus-within:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-400">
      {/* Locked prefix */}
      <span className="px-3 py-2.5 text-sm font-mono text-zinc-400 dark:text-zinc-500 select-none border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 shrink-0">
        ./
      </span>
      {/* Editable suffix */}
      <input
        id="output-dir"
        type="text"
        value={suffix}
        onChange={(e) => {
          // Strip leading slashes/dots the user might try to type
          const val = e.target.value.replace(/^[./]+/, "");
          onChange(val);
        }}
        className="flex-1 px-3 py-2.5 text-sm font-mono outline-none bg-transparent text-zinc-900 dark:text-zinc-100"
        placeholder="dist"
      />
    </div>
  );
}

interface RepoOption {
  value: GithubRepo;
  label: string;
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBuildSettings, setShowBuildSettings] = useState(false);

  // Build config fields
  const [rootDir, setRootDir] = useState("");
  const [framework, setFramework] = useState("");
  const [installCmd, setInstallCmd] = useState("npm install");
  const [buildCmd, setBuildCmd] = useState("npm run build");
  // outputDirSuffix = the part AFTER the locked "./" prefix
  const [outputDirSuffix, setOutputDirSuffix] = useState("dist");
  const [envText, setEnvText] = useState("");

  const reposQuery = useGithubRepos();

  const repoOptions: RepoOption[] = (reposQuery.data ?? []).map((repo) => ({
    value: repo,
    label: repo.full_name,
  }));

  // When a framework is selected → auto-fill build settings
  const handleFrameworkChange = (id: string) => {
    setFramework(id);
    if (!id) return;
    const def = FRAMEWORK_MAP[id];
    if (!def) return;
    setInstallCmd(def.installCmd);
    setBuildCmd(def.buildCmd);
    setOutputDirSuffix(def.outputDirSuffix);
    // Open build settings panel so the user can see the auto-filled values
    setShowBuildSettings(true);
  };

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.setQueryData<DashboardData>(["dashboard"], (old) => {
        if (!old) return old;
        return {
          ...old,
          projects: [{ ...project }, ...old.projects],
        };
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/projects/${project.id}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!selectedRepo) {
      setError("Please select a repository");
      return;
    }

    if (!framework) {
      setError("Please select a framework");
      return;
    }

    // Full outputDir sent to the backend always starts with "./"
    const outputDir = `./${outputDirSuffix}`;

    // Parse env vars from textarea
    const envVars: Record<string, string> = {};
    envText
      .split("\n")
      .filter((line) => line.includes("="))
      .forEach((line) => {
        const idx = line.indexOf("=");
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key) envVars[key] = val;
      });

    const payload: CreateProjectInput = {
      name,
      repoUrl: selectedRepo.clone_url,
      ...(rootDir !== "/" && { rootDir }),
      ...(installCmd !== "npm install" && { installCmd }),
      ...(buildCmd !== "npm run build" && { buildCmd }),
      ...(outputDir !== "./dist" && { outputDir }),
      framework,
      ...(Object.keys(envVars).length > 0 && { envVars }),
    };

    try {
      await createProjectMutation.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  // Detect dark mode from the HTML data-theme attribute
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <DashboardLayout>
      <div className="max-w-160 mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-d-fg m-0">
              New Project
            </h1>
            <p className="text-sm text-neutral-500 dark:text-d-500 mt-1 m-0">
              Import a GitHub repository to deploy
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
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
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Project Name
              </label>

              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder="my-website"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              />

              <p className="mt-2 text-xs text-zinc-500">
                A unique name for your project
              </p>
            </div>

            {/* Repository — React Select */}
            <div>
              <label
                htmlFor="repo-select"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Repository
              </label>

              <Select<RepoOption>
                inputId="repo-select"
                options={repoOptions}
                isLoading={reposQuery.isLoading}
                placeholder="Search repositories…"
                noOptionsMessage={() =>
                  reposQuery.isLoading
                    ? "Loading repositories…"
                    : "No repositories found"
                }
                value={
                  selectedRepo
                    ? (repoOptions.find(
                        (o) => o.value.id === selectedRepo.id,
                      ) ?? null)
                    : null
                }
                onChange={(option) => {
                  if (!option) {
                    setSelectedRepo(null);
                    return;
                  }
                  setSelectedRepo(option.value);
                  if (!name.trim()) {
                    setName(option.value.name);
                  }
                }}
                isClearable
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: "0.75rem",
                    borderColor: state.isFocused
                      ? isDark
                        ? "#71717a"
                        : "#18181b"
                      : isDark
                        ? "#3f3f46"
                        : "#d4d4d8",
                    backgroundColor: isDark ? "#09090b" : "#ffffff",
                    padding: "0.25rem 0.25rem",
                    fontSize: "0.875rem",
                    boxShadow: state.isFocused
                      ? isDark
                        ? "0 0 0 1px #71717a"
                        : "0 0 0 1px #18181b"
                      : "none",
                    "&:hover": {
                      borderColor: isDark ? "#52525b" : "#a1a1aa",
                    },
                    minHeight: "44px",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "0.75rem",
                    border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`,
                    backgroundColor: isDark ? "#18181b" : "#ffffff",
                    boxShadow:
                      "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    zIndex: 50,
                    marginTop: "4px",
                  }),
                  menuList: (base) => ({
                    ...base,
                    padding: "0.25rem",
                    maxHeight: "240px",
                  }),
                  option: (base, state) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: state.isFocused
                      ? isDark
                        ? "#27272a"
                        : "#f4f4f5"
                      : "transparent",
                    color: isDark ? "#fafafa" : "#18181b",
                    cursor: "pointer",
                    "&:active": {
                      backgroundColor: isDark ? "#3f3f46" : "#e4e4e7",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: isDark ? "#fafafa" : "#18181b",
                  }),
                  input: (base) => ({
                    ...base,
                    color: isDark ? "#fafafa" : "#18181b",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                  }),
                  indicatorSeparator: () => ({ display: "none" }),
                  dropdownIndicator: (base, state) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                    transition: "transform 150ms",
                    transform: state.selectProps.menuIsOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    "&:hover": {
                      color: isDark ? "#a1a1aa" : "#52525b",
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                    "&:hover": {
                      color: isDark ? "#fafafa" : "#18181b",
                    },
                  }),
                  loadingIndicator: (base) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                  }),
                  noOptionsMessage: (base) => ({
                    ...base,
                    color: isDark ? "#71717a" : "#a1a1aa",
                    fontSize: "0.875rem",
                  }),
                }}
              />

              <p className="mt-2 text-xs text-zinc-500">
                Search and select a public GitHub repository
              </p>
            </div>

            {/* Framework — always visible, required */}
            <div>
              <label
                htmlFor="framework-select"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Framework
                <span className="ml-1.5 text-xs font-normal text-red-500">
                  *
                </span>
              </label>

              <FrameworkDropdown
                value={framework}
                onChange={handleFrameworkChange}
              />

              <p className="mt-2 text-xs text-zinc-500">
                Only supported frameworks can be deployed.
              </p>
            </div>

            {/* Build Settings Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowBuildSettings(!showBuildSettings)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-transparent border-none cursor-pointer transition hover:text-zinc-900 dark:hover:text-zinc-200 p-0"
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
                  className={`transition-transform duration-200 ${showBuildSettings ? "rotate-90" : ""}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                Build &amp; Output Settings
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">
                  (optional)
                </span>
              </button>

              {showBuildSettings && (
                <div className="mt-4 space-y-4 pl-0 animate-fade-in">
                  {/* Root Dir */}
                  <div className="max-w-[50%]">
                    <label
                      htmlFor="root-dir"
                      className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Root Directory
                    </label>

                    <RootDirInput suffix={rootDir} onChange={setRootDir} />

                    <p className="mt-1 text-xs text-zinc-400">
                      Subdirectory containing your app
                    </p>
                  </div>

                  {/* Install + Build Commands */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="install-cmd"
                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Install Command
                      </label>
                      <input
                        id="install-cmd"
                        type="text"
                        value={installCmd}
                        onChange={(e) => setInstallCmd(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="build-cmd"
                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Build Command
                      </label>
                      <input
                        id="build-cmd"
                        type="text"
                        value={buildCmd}
                        onChange={(e) => setBuildCmd(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                      />
                    </div>
                  </div>

                  {/* Output Directory */}
                  <div className="max-w-[50%]">
                    <label
                      htmlFor="output-dir"
                      className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Output Directory
                    </label>
                    <OutputDirInput
                      suffix={outputDirSuffix}
                      onChange={setOutputDirSuffix}
                    />
                  </div>

                  {/* Environment Variables */}
                  <div>
                    <label
                      htmlFor="env-vars"
                      className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Environment Variables
                    </label>
                    <textarea
                      id="env-vars"
                      rows={4}
                      value={envText}
                      onChange={(e) => setEnvText(e.target.value)}
                      placeholder={
                        "VITE_API_URL=https://api.example.com\nNEXT_PUBLIC_KEY=your-key"
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-mono outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 resize-y leading-relaxed"
                    />
                    <p className="mt-1 text-xs text-zinc-400">
                      One per line, KEY=VALUE format. These are injected into
                      install and build steps.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {createProjectMutation.isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
