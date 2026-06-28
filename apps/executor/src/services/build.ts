import { execa, ExecaError } from "execa";
import fs from "fs/promises";
import path from "path";
import { Job } from "../lib/job.js";
import { BuildError } from "../lib/build.error.js";

// Simple blocklist approach: reject commands that match known dangerous patterns.
// Runs BEFORE execa so nothing malicious ever spawns a shell.
const BLOCKED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  // Secret / credential access
  { pattern: /\/etc\/passwd/i, reason: "reading /etc/passwd is not allowed" },
  {
    pattern: /AWS_SECRET|AWS_ACCESS_KEY|AWS_SESSION_TOKEN/i,
    reason: "accessing AWS credentials is not allowed",
  },
  {
    pattern: /SECRET_KEY|API_KEY|PRIVATE_KEY/i,
    reason: "accessing secret keys is not allowed",
  },
  {
    pattern: /~\/.aws|~\/.ssh/i,
    reason: "accessing credential directories is not allowed",
  },

  // Archive extraction
  { pattern: /\bunzip\b/i, reason: "unzip is not allowed" },
  { pattern: /\bunzip2\b/i, reason: "unzip2 is not allowed" },
  { pattern: /\bgunzip\b/i, reason: "gunzip is not allowed" },
  {
    pattern: /\btar\b.*(-x|--extract)/i,
    reason: "tar extraction is not allowed",
  },
  { pattern: /\b7z\b.*\be\b/i, reason: "7zip extraction is not allowed" },

  // Dangerous shell tricks
  {
    pattern: /curl[^|]*\|\s*(bash|sh|python)/i,
    reason: "pipe-to-shell via curl is not allowed",
  },
  {
    pattern: /wget[^|]*\|\s*(bash|sh|python)/i,
    reason: "pipe-to-shell via wget is not allowed",
  },
  // Chained malicious commands (e.g. npm install && cat /etc/passwd)
  {
    pattern: /(&&|\|\||;)\s*cat\s+\/etc/i,
    reason: "chained sensitive file read is not allowed",
  },
  {
    pattern: /\bchmod\s+[0-9]*7[0-9]*\s+\//i,
    reason: "chmod on root paths is not allowed",
  },
  { pattern: /\brm\s+-rf\s+\//i, reason: "rm -rf / is not allowed" },
  {
    pattern: /\bdd\b.*of=\/dev/i,
    reason: "writing to raw devices is not allowed",
  },
  { pattern: /\/proc\/self\//i, reason: "reading /proc/self is not allowed" },
];

function validateCommand(cmd: string, label: string): void {
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(cmd)) {
      throw new BuildError(`[security] ${label} blocked — ${reason}: ${cmd}`, [
        `[executor] SECURITY: ${label} rejected — ${reason}`,
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
      "[executor] SECURITY: rootDir is absolute — rejected",
    ]);
  }
  const resolvedWorkDir = path.resolve(projectDir, rootDir);
  if (
    resolvedWorkDir !== path.resolve(projectDir) &&
    !resolvedWorkDir.startsWith(path.resolve(projectDir) + path.sep)
  ) {
    throw new BuildError("[security] rootDir escapes the project sandbox", [
      `[executor] SECURITY: rootDir '${rootDir}' resolves outside project directory — rejected`,
    ]);
  }

  // 2. outputDir must not be absolute and must not escape workDir
  if (path.isAbsolute(outputDir)) {
    throw new BuildError("[security] outputDir must not be an absolute path", [
      "[executor] SECURITY: outputDir is absolute — rejected",
    ]);
  }
  const resolvedOutputDir = path.resolve(resolvedWorkDir, outputDir);
  if (
    resolvedOutputDir !== resolvedWorkDir &&
    !resolvedOutputDir.startsWith(resolvedWorkDir + path.sep)
  ) {
    throw new BuildError("[security] outputDir escapes the project sandbox", [
      `[executor] SECURITY: outputDir '${outputDir}' resolves outside workDir — rejected`,
    ]);
  }

  logs.push(
    `[executor] Path validation passed — workDir: ${resolvedWorkDir}, outputDir: ${resolvedOutputDir}`,
  );
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
      `[executor] WARNING: '${normalized}' is not a common output directory for '${framework}'.`,
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
    if (!body.outputDir.trim()) {
      throw new BuildError("[security] outputDir cannot be empty", [
        "[executor] SECURITY: empty outputDir rejected",
      ]);
    }

    const clone = await execa("git", ["clone", repoUrl, projectDir]);
    logs.push(clone.stdout);
    logs.push(clone.stderr);

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
