/**
 * StatusBadge — color-coded pill for deployment statuses.
 * Single source of truth, used across Dashboard, Project, Deployments pages.
 */

export type Status = "pending" | "building" | "success" | "failed" | "cancelled";

interface StatusBadgeProps {
  status: Status;
}

const CONFIG: Record<Status, { label: string; className: string; dotColor: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotColor: "#f59e0b",
  },
  building: {
    label: "Building",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotColor: "#3b82f6",
  },
  success: {
    label: "Ready",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotColor: "#10b981",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    dotColor: "#ef4444",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-neutral-200/80 dark:bg-d-200 text-neutral-500 dark:text-d-500 border-neutral-200 dark:border-d-200",
    dotColor: "#6b7280",
  },
};

/** Inline badge pill */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${className}`}
    >
      <StatusDot status={status} />
      {label}
    </span>
  );
}

/** Just the coloured dot, for compact rows */
export function StatusDot({ status }: StatusBadgeProps) {
  const { dotColor } = CONFIG[status] ?? CONFIG.pending;
  const isAnimated = status === "building" || status === "pending";
  return (
    <span className="relative flex w-1.5 h-1.5 shrink-0">
      {isAnimated && (
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ backgroundColor: dotColor }}
          aria-hidden
        />
      )}
      <span
        className="relative inline-flex rounded-full w-1.5 h-1.5"
        style={{ backgroundColor: dotColor }}
      />
    </span>
  );
}
