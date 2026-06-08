import { execa } from "execa";
import fs from "fs/promises";
import path from "path";
import { Job } from "../lib/job";

export const executeProcess = async (body:Job) => { //TODO: use fields from the job instead of hardcoded
  const repoUrl = body.repoUrl;
  const deploymentId = body.deploymentId;
  const logs: string[] = [];
  await fs.mkdir("/tmp/builds", {
    recursive: true,
  });
  const projectDir = path.join("/tmp/builds", String(deploymentId));
  const clone = await execa("git", ["clone", repoUrl, projectDir]);
  logs.push(clone.stdout);
  logs.push(clone.stderr);

  const hasLockFile = await fs
    .stat(path.join(projectDir, "package-lock.json"))
    .then(() => true)
    .catch(() => false);

  if (hasLockFile) {
    const install = await execa("npm", ["ci"], { cwd: projectDir });
    logs.push(install.stdout);
    logs.push(install.stderr);
  } else {
    const install = await execa("npm", ["i"], { cwd: projectDir });
    logs.push(install.stdout);
    logs.push(install.stderr);
  }
  const build = await execa("npm", ["run", "build"], { cwd: projectDir });
  logs.push(build.stdout);
  logs.push(build.stderr);
  return logs;
};
