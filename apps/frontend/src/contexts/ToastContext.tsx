/**
 * Toast notification context + provider.
 * Replaces alert() calls and setTimeout-based inline banners.
 * Usage: const { toast } = useToast()
 *        toast.success("Saved!") | toast.error("Failed.") | toast.info("...")
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconCheck, IconAlertCircle, IconX } from "../components/ui/icons";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++counterRef.current;
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    success: (msg) => push("success", msg),
    error: (msg) => push("error", msg),
    info: (msg) => push("info", msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

// ─── Toast Stack UI ───────────────────────────────────────────────────────────
const STYLES: Record<ToastType, string> = {
  success:
    "border-green-500/30 bg-green-500/10 text-green-400",
  error:
    "border-red-500/30 bg-red-500/10 text-red-400",
  info:
    "border-neutral-600 bg-neutral-800 text-neutral-200",
};

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px] font-medium shadow-2xl backdrop-blur-sm min-w-[220px] max-w-[380px] animate-fade-in ${STYLES[t.type]}`}
        >
          {t.type === "success" && <IconCheck size={14} />}
          {t.type === "error" && <IconAlertCircle size={14} />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer text-inherit"
            aria-label="Dismiss"
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
