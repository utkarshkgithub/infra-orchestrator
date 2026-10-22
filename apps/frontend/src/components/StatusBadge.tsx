import type { Deployment } from "../lib/types";

const base =
  "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide whitespace-no-wrap";

const config: Record<Deployment["status"], { label: string; colors: string }> =
  {
    pending: { label: "Pending", colors: "bg-amber-500/10 text-amber-600" },
    building: { label: "Building", colors: "bg-blue-500/10 text-blue-600" },
    success: { label: "Ready", colors: "bg-green-500/10 text-green-600" },
    failed: { label: "Failed", colors: "bg-red-500/10 text-red-600" },
    cancelled: { label: "Cancelled", colors: "bg-neutral-500/10 text-neutral-500" },
  };

export default function StatusBadge({
  status,
  className = "",
}: {
  status: Deployment["status"];
  className?: string;
}) {
  const entry = config[status] ?? config.pending;
  return (
    <span className={`${base} ${entry.colors} ${className}`}>{entry.label}</span>
  );
}
