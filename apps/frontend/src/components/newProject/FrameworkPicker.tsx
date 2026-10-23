/**
 * FrameworkPicker — custom accessible dropdown replacing react-select.
 * Shows framework name + colored dot, auto-closes on outside click.
 */

import { useState } from "react";
import { FRAMEWORKS, FRAMEWORK_MAP } from "./frameworks";
import { IconChevronDown, IconCheck } from "../ui/icons";
import { useClickOutside } from "../../hooks/useClickOutside";

interface FrameworkPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function FrameworkPicker({ value, onChange }: FrameworkPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const selected = value ? FRAMEWORK_MAP[value] : null;

  return (
    <div ref={ref} className="relative">
      <button
        id="framework-select"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-150 cursor-pointer",
          "bg-white dark:bg-d-bg font-sans",
          open
            ? "border-neutral-400 dark:border-d-400 ring-2 ring-black/5 dark:ring-white/5"
            : "border-neutral-200 dark:border-d-200 hover:border-neutral-300 dark:hover:border-d-300",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {selected ? (
            <>
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selected.color }}
                aria-hidden
              />
              <span className="text-black dark:text-d-fg truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-neutral-400 dark:text-d-400">Select a framework…</span>
          )}
        </span>
        <IconChevronDown
          size={14}
          className={`shrink-0 text-neutral-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-d-200 shadow-xl bg-white dark:bg-d-bg overflow-hidden animate-dropdown-in"
        >
          <div className="p-1">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.id}
                type="button"
                role="option"
                aria-selected={value === fw.id}
                onClick={() => { onChange(fw.id); setOpen(false); }}
                className={[
                  "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors cursor-pointer border-none font-sans",
                  value === fw.id
                    ? "bg-neutral-100 dark:bg-d-100 text-black dark:text-d-fg font-semibold"
                    : "text-neutral-700 dark:text-d-700 hover:bg-neutral-50 dark:hover:bg-d-50",
                ].join(" ")}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: fw.color }} aria-hidden />
                <span>{fw.label}</span>
                {value === fw.id && <IconCheck size={12} className="ml-auto text-neutral-500 dark:text-d-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
