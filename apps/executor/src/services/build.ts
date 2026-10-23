import { execa, ExecaError } from "execa";
import fs from "fs/promises";
import path from "path";
import { Job } from "../lib/job.js";
import { BuildError } from "../lib/build.error.js";
import {BLOCKED_PATTERNS} from "../lib/blockedPatterns.js"

function validateCommand(cmd: string, label: string): void {
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(cmd)) {
      throw new BuildError(`[security] ${label} blocked — ${reason}: ${cmd}`, [
        `SECURITY: ${label} rejected — ${reason}`,
      ]);
    }
  }
}

// Validates that user-supplied rootDir and outputDir stay strictly inside
// the per-deployment sandbox (/tmp/builds/<id>).
function validatePaths(
  projectDir: string,
  rootDir: string,
  outputDir: string,
  logs: string[],
): { workDir: string; resolvedOutputDir: string } {
  // 1. rootDir must not be absolute and must not escape projectDir
  if (path.isAbsolute(rootDir)) {
    throw new BuildError("[security] rootDir must not be an absolute path", [
      "SECURITY: rootDir is absolute — rejected",
    ]);
  }
  const resolvedWorkDir = path.resolve(projectDir, rootDir);
  if (
    resolvedWorkDir !== path.resolve(projectDir) &&
    !resolvedWorkDir.startsWith(path.resolve(projectDir) + path.sep)
  ) {
    throw new BuildError("[security] rootDir escapes the project sandbox", [
      `SECURITY: rootDir '${rootDir}' resolves outside project directory — rejected`,
    ]);
  }

  // 2. outputDir must not be absolute and must not escape workDir
  if (path.isAbsolute(outputDir)) {
    throw new BuildError("[security] outputDir must not be an absolute path", [
      "SECURITY: outputDir is absolute — rejected",
    ]);
  }
  const resolvedOutputDir = path.resolve(resolvedWorkDir, outputDir);
  if (
    resolvedOutputDir !== resolvedWorkDir &&
    !resolvedOutputDir.startsWith(resolvedWorkDir + path.sep)
  ) {
    throw new BuildError("[security] outputDir escapes the project sandbox", [
      `SECURITY: outputDir '${outputDir}' resolves outside workDir — rejected`,
    ]);
  }

  // logs.push(
  //   `[executor] Path validation passed — workDir: ${resolvedWorkDir}, outputDir: ${resolvedOutputDir}`,
  // );
  return { workDir: resolvedWorkDir, resolvedOutputDir };
}

// Used to emit a warning when the user-declared outputDir doesn't match the
// framework default. Non-fatal: custom build configs (vite.config.js etc.) are
// allowed to override these.
const FRAMEWORK_OUTPUT_DIRS: Record<string, readonly string[]> = {
  react: ["dist", "build"],
  vue: ["dist"],
  solid: ["dist"],
  astro: ["dist"],
  next: ["out"],
  angular: ["dist", "dist/browser"],
  svelte: ["dist", "build"],
};

function warnIfUnexpectedOutputDir(
  framework: string | null,
  outputDir: string,
  logs: string[],
) {
  if (!framework) return;

  const allowed = FRAMEWORK_OUTPUT_DIRS[framework.toLowerCase()];
  if (!allowed) return;

  const normalized = path.normalize(outputDir).replace(/^[./]+/, "");

  if (!allowed.includes(normalized)) {
    logs.push(
      `WARNING: '${normalized}' is not a common output directory for '${framework}'.`,
    );
  }
}

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

    // Validate paths BEFORE cloning so we fail fast on bad input
    const { workDir } = validatePaths(
      projectDir,
      body.rootDir,
      body.outputDir,
      logs,
    );

    const normalizedOutput = path.normalize(body.outputDir);
    warnIfUnexpectedOutputDir(body.framework, normalizedOutput, logs);
    if (!normalizedOutput.trim()) {
      throw new BuildError("[security] outputDir cannot be empty", [
        "SECURITY: empty outputDir rejected",
      ]);
    }

    const clone = await execa("git", ["clone", repoUrl, projectDir]);
    logs.push(clone.stdout);
    logs.push(clone.stderr);
    
    const checkout = await execa("git", ["checkout", body.commitHash],{
      cwd: projectDir
    })
    // Safe env whitelist: only expose minimal system vars + user-supplied envVars.
    // This prevents leaking executor secrets (AWS keys, SQS, backend token) into user builds.
    const buildEnv: Record<string, string> = {
      ...(process.env.PATH ? { PATH: process.env.PATH } : {}),
      ...(process.env.HOME ? { HOME: process.env.HOME } : {}),
      ...(process.env.TMPDIR ? { TMPDIR: process.env.TMPDIR } : {}),
      CI: "true",
      ...(body.envVars ?? {}),
    };

    // Validate commands before executing
    validateCommand(body.installCmd, "installCmd");
    validateCommand(body.buildCmd, "buildCmd");

    logs.push(`Running install: ${body.installCmd}`);
    const install = await execa(body.installCmd, {
      cwd: workDir,
      env: buildEnv,
      shell: true,
      extendEnv: false,
    });
    logs.push(install.stdout);
    logs.push(install.stderr);

    logs.push(`Running build: ${body.buildCmd}`);
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
