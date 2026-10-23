// Simple blocklist approach: reject commands that match known dangerous patterns.

export const BLOCKED_PATTERNS: { pattern: RegExp; reason: string }[] = [
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