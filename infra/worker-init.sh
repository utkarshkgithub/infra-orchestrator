#!/usr/bin/env bash
# Init script for the Oracle Cloud worker (Ubuntu minimal).
# Installs everything apps/executor needs to run and build projects.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get upgrade -y

# Base tooling (minimal image ships without curl/git/etc)
apt-get install -y \
  curl ca-certificates gnupg git unzip \
  build-essential python3

# Node.js 22 LTS (build commands run arbitrary npm/pnpm installs, need modern node)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# pnpm via corepack (projects may use pnpm as installCmd/buildCmd)
# flag: corepack prompts to download mismatched versions; disable for non-interactive runs
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable
corepack prepare pnpm@latest --activate

# Executor workspace for builds
mkdir -p /tmp/builds
chown -R "$SUDO_USER:$SUDO_USER" /tmp/builds

# Executor app dependencies only.
# typescript/tsx/@types/node were added to apps/executor devDeps so the root
# package (which carries prisma, turbo, eslint) is NOT needed on this box.
# flag: script runs as root so $HOME=/root under plain sudo; fall back to the ubuntu user's home
REPO_ROOT="/home/ubuntu/infra-orchestrator"
[[ -f "$REPO_ROOT/pnpm-lock.yaml" ]] || REPO_ROOT="$HOME/infra-orchestrator"
if [[ ! -f "$REPO_ROOT/pnpm-lock.yaml" ]]; then
  echo "Repo not found at $REPO_ROOT — git clone it after installing git, then re-run." >&2
  exit 1
fi

cd "$REPO_ROOT"
pnpm install --frozen-lockfile --filter executor

node --version && npm --version && git --version && pnpm --version
echo "Worker setup complete."
echo "Start the worker with: cd $REPO_ROOT/apps/executor && pnpm build && node dist/index.js"
