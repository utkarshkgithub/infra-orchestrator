/**
 * SettingsTab — project settings form.
 * Extracted from the monolithic ProjectDetailPage. Uses toast for feedback
 * instead of inline banners with setTimeout.
 */

import { useState } from "react";
import { updateProject } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../ui/Button";
import { IconTrash } from "../ui/icons";
import type { Project } from "../../lib/types";
import {
  formatEnvVars,
  normalizeOutputDir,
  normalizeRootDir,
  parseEnvVars,
  projectPayload,
} from "../../lib/utils";

interface SettingsTabProps {
  project: Project;
  onUpdate: (updated: Project) => void;
}

const INPUT =
  "w-full px-3 py-2 text-sm font-sans border border-neutral-200 dark:border-d-200 rounded-lg bg-white dark:bg-d-bg text-black dark:text-d-fg outline-none transition-all duration-150 focus:border-neutral-400 dark:focus:border-d-400 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 box-border";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-neutral-700 dark:text-d-700"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-neutral-400 dark:text-d-400 m-0">{hint}</p>
      )}
    </div>
  );
}

export function SettingsTab({ project, onUpdate }: SettingsTabProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    repoUrl: project.repoUrl,
    rootDir: project.rootDir,
    installCmd: project.installCmd,
    buildCmd: project.buildCmd,
    outputDir: project.outputDir,
    framework: project.framework ?? "",
  });
  const [envText, setEnvText] = useState(formatEnvVars(project.envVars));

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProject(
        projectPayload(project, {
          name: form.name.trim(),
          repoUrl: form.repoUrl.trim(),
          rootDir: normalizeRootDir(form.rootDir),
          installCmd: form.installCmd.trim() || "npm install",
          buildCmd: form.buildCmd.trim() || "npm run build",
          outputDir: normalizeOutputDir(form.outputDir),
          framework: form.framework.trim() || null,
          envVars: parseEnvVars(envText),
        }),
      );
      onUpdate(updated);
      toast.success("Project settings saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="max-w-[640px] rounded-2xl border border-neutral-200 dark:border-d-200 bg-white dark:bg-d-50 p-6 shadow-sm flex flex-col gap-8"
      onSubmit={handleSave}
    >
      {/* General */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-black dark:text-d-fg m-0 pb-3 border-b border-neutral-100 dark:border-d-100">
          General
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Project Name" htmlFor="s-name">
            <input id="s-name" className={INPUT} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Repository URL" htmlFor="s-repo">
            <input id="s-repo" className={INPUT} value={form.repoUrl} onChange={(e) => set("repoUrl", e.target.value)} />
          </Field>
        </div>
      </section>

      {/* Build */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-black dark:text-d-fg m-0 pb-3 border-b border-neutral-100 dark:border-d-100">
          Build Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Root Directory" htmlFor="s-root" hint="Leave empty for the repo root">
            <input id="s-root" className={INPUT} value={form.rootDir} onChange={(e) => set("rootDir", e.target.value)} />
          </Field>
          <Field label="Framework" htmlFor="s-fw">
            <input id="s-fw" className={INPUT} placeholder="Auto-detected" value={form.framework} onChange={(e) => set("framework", e.target.value)} />
          </Field>
          <Field label="Install Command" htmlFor="s-install">
            <input id="s-install" className={`${INPUT} font-mono`} value={form.installCmd} onChange={(e) => set("installCmd", e.target.value)} />
          </Field>
          <Field label="Build Command" htmlFor="s-build">
            <input id="s-build" className={`${INPUT} font-mono`} value={form.buildCmd} onChange={(e) => set("buildCmd", e.target.value)} />
          </Field>
          <Field label="Output Directory" htmlFor="s-out">
            <input id="s-out" className={`${INPUT} font-mono`} value={form.outputDir} onChange={(e) => set("outputDir", e.target.value)} />
          </Field>
        </div>
      </section>

      {/* Env vars */}
      <section className="flex flex-col gap-3">
        <div className="pb-3 border-b border-neutral-100 dark:border-d-100">
          <h3 className="text-sm font-semibold text-black dark:text-d-fg m-0">
            Environment Variables
          </h3>
          <p className="text-[12px] text-neutral-400 dark:text-d-400 m-0 mt-0.5">
            One per line in <code className="font-mono">KEY=VALUE</code> format
          </p>
        </div>
        <textarea
          className={`${INPUT} font-mono text-[12px] leading-relaxed resize-y`}
          rows={7}
          placeholder={"NEXT_PUBLIC_API_URL=https://api.example.com\nNODE_ENV=production"}
          value={envText}
          onChange={(e) => setEnvText(e.target.value)}
        />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-100 dark:border-d-100">
        {/* TODO_FRONTEND: Enable delete once backend exposes DELETE /project/:id */}
        <Button
          type="button"
          variant="danger"
          size="sm"
          icon={<IconTrash size={13} />}
          disabled
          title="Delete project (coming soon)"
        >
          Delete project
        </Button>
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
