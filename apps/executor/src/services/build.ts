import { execa, ExecaError } from "execa";
import fs from "fs/promises";
import path from "path";
import { Job } from "../lib/job.js";
import { BuildError } from "../lib/build.error.js";

export const executeBuildProcess = async (body: Job) => {
  const logs: string[] = [];
  try {
    const repoUrl = body.repoUrl;
    const deploymentId = body.deploymentId;
    await fs.mkdir("/tmp/builds", {
      recursive: true,
    });
    const projectDir = path.join("/tmp/builds", String(deploymentId));
    await fs.rm(projectDir, {
      recursive: true,
      force: true,
    });
    const clone = await execa("git", ["clone", repoUrl, projectDir]);
    logs.push(clone.stdout);
    logs.push(clone.stderr);

    const workDir = path.join(projectDir, body.rootDir);

    // Safe env whitelist: only expose minimal system vars + user-supplied envVars.
    // This prevents leaking executor secrets (AWS keys, SQS, backend token) into user builds.
    const buildEnv: Record<string, string> = {
      ...(process.env.PATH ? { PATH: process.env.PATH } : {}),
      ...(process.env.HOME ? { HOME: process.env.HOME } : {}),
      ...(process.env.TMPDIR ? { TMPDIR: process.env.TMPDIR } : {}),
      CI: "true",
      ...(body.envVars ?? {}),
    };

    logs.push(`[executor] Running install: ${body.installCmd}`);
    const install = await execa(body.installCmd, {
      cwd: workDir,
      env: buildEnv,
      shell: true,
      extendEnv: false,
    });
    logs.push(install.stdout);
    logs.push(install.stderr);

    logs.push(`[executor] Running build: ${body.buildCmd}`);
    const build = await execa(body.buildCmd, {
      cwd: workDir,
      env: buildEnv,
      shell: true,
      extendEnv: false,
    });
    logs.push(build.stdout);
    logs.push(build.stderr);
    return logs;
  } catch (err) {
    if (err instanceof ExecaError) {
      logs.push(err.stdout ?? "");
      logs.push(err.stderr ?? "");
    }
    if (err instanceof Error) {
      logs.push(err.name ?? "");
      logs.push(err.message ?? "");
    }
    throw new BuildError(
      err instanceof Error ? err.message : "Build failed",
      logs,
    );
  }
};
