/**
 * DeployCard — the deployment trigger widget on the Project detail page.
 * Shows current commit hash (prefilled from GitHub), validates it, and
 * triggers the deployment. Replaces the alert()-based deploy flow.
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDeployment, getHeadCommit, updateProject } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../ui/Button";
import { IconDeploy } from "../ui/icons";
import type { Deployment, Project } from "../../lib/types";
import {
  isValidCommitHash,
  normalizeRootDir,
  projectPayload,
  repoFullName,
} from "../../lib/utils";

interface DeployCardProps {
  project: Project;
  onDeployed: (dep: Deployment) => void;
}

export function DeployCard({ project, onDeployed }: DeployCardProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [commitHash, setCommitHash] = useState("");
  const [commitEdited, setCommitEdited] = useState(false);
  const [fetchingCommit, setFetchingCommit] = useState(false);

  // Prefill with latest HEAD commit
  useEffect(() => {
    if (!project.repoUrl) return;
    let cancelled = false;
    setFetchingCommit(true);
    void getHeadCommit(repoFullName(project.repoUrl)).then((sha) => {
      if (!cancelled) {
        setCommitHash(sha);
        setFetchingCommit(false);
      }
    });
    return () => { cancelled = true; };
  }, [project.repoUrl]);

  const commitValid = isValidCommitHash(commitHash);

  const deployMutation = useMutation({
    mutationFn: async () => {
      if (!commitValid) throw new Error("Enter a commit hash of 7–40 hex characters.");

      // Normalise rootDir if needed (executor rejects absolute paths)
      if (project.rootDir !== normalizeRootDir(project.rootDir)) {
        await updateProject(projectPayload(project));
      }

      return createDeployment(project.id, commitHash.trim());
    },
    onSuccess: (dep) => {
      queryClient.setQueryData<Deployment[]>(["deployments"], (prev = []) => [dep, ...prev]);
      onDeployed(dep);
      toast.success("Deployment queued! Build is starting…");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Deployment failed");
    },
  });

  return (
    <div className="flex flex-col gap-2 p-4 border border-neutral-200 dark:border-d-200 rounded-xl bg-neutral-50/50 dark:bg-d-50">
      <label
        htmlFor="commit-hash"
        className="text-[11px] uppercase tracking-widest text-neutral-400 dark:text-d-400 font-semibold"
      >
        Deploy commit
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          id="commit-hash"
          type="text"
          spellCheck={false}
          value={fetchingCommit ? "Loading HEAD…" : commitHash}
          readOnly={fetchingCommit}
          onChange={(e) => {
            setCommitHash(e.target.value);
            setCommitEdited(true);
          }}
          placeholder="commit hash (7–40 hex)"
          className="flex-1 min-w-[180px] rounded-lg px-3 py-2 text-[12px] font-mono bg-white dark:bg-d-bg text-black dark:text-d-fg border border-neutral-200 dark:border-d-200 outline-none transition focus:border-neutral-400 dark:focus:border-d-400 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5"
        />
        <Button
          variant="primary"
          icon={<IconDeploy size={14} />}
          loading={deployMutation.isPending}
          disabled={!commitValid || fetchingCommit}
          onClick={() => deployMutation.mutate()}
        >
          Deploy
        </Button>
      </div>
      {!commitValid && commitEdited && (
        <p className="text-[11px] text-red-500 m-0">
          A commit hash is 7–40 hexadecimal characters.
        </p>
      )}
      {!commitValid && !commitEdited && !fetchingCommit && commitHash === "" && (
        <p className="text-[11px] text-neutral-400 dark:text-d-400 m-0">
          Could not read HEAD from GitHub — paste a commit hash to deploy.
        </p>
      )}
    </div>
  );
}
