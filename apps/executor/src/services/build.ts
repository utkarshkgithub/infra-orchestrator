import { execa, ExecaError } from "execa";
import fs from "fs/promises";
import path from "path";
import { Job } from "../lib/job.js";
import { BuildError } from "../lib/build.error.js";

export const executeBuildProcess = async (body: Job) => {
  //TODO: use fields from the job instead of hardcoded
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

    const hasLockFile = await fs
      .access(path.join(workDir, "package-lock.json"))
      .then(() => true)
      .catch(() => false);

    if (hasLockFile) {
      const install = await execa("npm", ["ci"], { cwd: workDir });
      logs.push(install.stdout);
      logs.push(install.stderr);
    } else {
      const install = await execa("npm", ["i"], { cwd: workDir });
      logs.push(install.stdout);
      logs.push(install.stderr);
    }
    const build = await execa("npm", ["run", "build"], { cwd: workDir });
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
