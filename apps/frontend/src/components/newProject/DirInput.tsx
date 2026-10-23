
import { IconFolders, IconX } from "../ui/icons";

interface DirInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DirInput({
  id,
  value,
  onChange,
  placeholder = "",
}: DirInputProps) {
  return (
    <div className="relative">
      <IconFolders
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-d-400 pointer-events-none"
      />

      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={[
          "w-full rounded-xl border px-9 py-2.5 text-sm outline-none",
          "bg-white dark:bg-d-bg font-sans text-black dark:text-d-fg",
          "border-neutral-200 dark:border-d-200",
          "placeholder:text-neutral-400 dark:placeholder:text-d-400",
          "hover:border-neutral-300 dark:hover:border-d-300",
          "focus:border-neutral-400 dark:focus:border-d-400",
          "focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5",
          "transition-all duration-150",
        ].join(" ")}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear directory path"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 dark:text-d-400 hover:bg-neutral-100 dark:hover:bg-d-100 hover:text-black dark:hover:text-d-fg transition-colors cursor-pointer"
        >
          <IconX size={13} />
        </button>
      )}
    </div>
  );
}
