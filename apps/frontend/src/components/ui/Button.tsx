/**
 * Atomic Button component — production-grade, accessible, with variants.
 */
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-black dark:bg-d-fg text-white dark:text-d-bg border border-transparent hover:opacity-85",
  secondary:
    "bg-white dark:bg-d-bg text-neutral-700 dark:text-d-700 border border-neutral-200 dark:border-d-200 hover:bg-neutral-50 dark:hover:bg-d-50 hover:text-black dark:hover:text-d-fg",
  ghost:
    "bg-transparent text-neutral-600 dark:text-d-600 border border-transparent hover:bg-neutral-100 dark:hover:bg-d-100 hover:text-black dark:hover:text-d-fg",
  danger:
    "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-[12px] rounded-md gap-1",
  md: "px-3.5 py-2 text-[13px] rounded-lg gap-1.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className = "",
      disabled,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center font-medium font-sans",
          "cursor-pointer select-none transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        ].join(" ")}
        {...rest}
      >
        {loading ? (
          <span
            className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin-fast opacity-70"
            aria-hidden
          />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
