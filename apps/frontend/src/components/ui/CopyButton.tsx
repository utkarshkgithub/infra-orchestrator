/**
 * CopyButton — copies text and shows brief confirmation feedback.
 * Works on any clipboard-capable environment with a clean fallback.
 */

import { useState } from "react";
import { IconCopy, IconCheck } from "./icons";
import { Button } from "./Button";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      className={className}
      icon={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}
