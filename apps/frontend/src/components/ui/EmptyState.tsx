/**
 * EmptyState — designed empty states replacing bare SVG placeholder blobs.
 * Consistent visual language for zero-data screens across all pages.
 */

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-8 border border-dashed border-neutral-200 dark:border-d-200 rounded-2xl gap-3">
      <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-d-100 flex items-center justify-center text-neutral-400 dark:text-d-400">
        {icon}
      </div>
      <div className="flex flex-col gap-1 max-w-[280px]">
        <h3 className="text-[15px] font-semibold m-0 text-black dark:text-d-fg">{title}</h3>
        <p className="text-[13px] text-neutral-500 dark:text-d-500 m-0 leading-relaxed">{description}</p>
      </div>
      {action && (
        action.to ? (
          <Link
            to={action.to}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent rounded-lg no-underline transition-all duration-150 hover:opacity-85 mt-1"
          >
            {action.label}
          </Link>
        ) : (
          <Button onClick={action.onClick} className="mt-1">
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

/** Error state variant */
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-[18px] font-bold">
        !
      </div>
      <p className="text-sm text-neutral-500 dark:text-d-500 text-center max-w-[300px]">
        {message ?? "Something went wrong"}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Generic skeleton row for loading states */
export function SkeletonLine({ w = "100%" }: { w?: string }) {
  return (
    <div
      className="h-4 rounded bg-neutral-200 dark:bg-d-200 animate-pulse"
      style={{ width: w }}
    />
  );
}
