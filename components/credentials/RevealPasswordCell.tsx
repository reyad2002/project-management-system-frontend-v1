"use client";

import { useEffect, useState } from "react";
import { Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

const AUTO_HIDE_MS = 15_000;

interface RevealPasswordCellProps {
  onReveal: () => Promise<string>;
}

export function RevealPasswordCell({ onReveal }: RevealPasswordCellProps) {
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!password) return;
    const hideTimer = setTimeout(() => setPassword(null), AUTO_HIDE_MS);
    return () => clearTimeout(hideTimer);
  }, [password]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  if (password) {
    return (
      <span className="flex items-center gap-2 font-mono text-sm">
        {password}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(password);
            setCopied(true);
          }}
          className="text-(--muted) hover:text-(--primary)"
          aria-label="Copy password"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        {copied && <span className="text-xs text-(--success)">Copied</span>}
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          setPassword(await onReveal());
        } finally {
          setLoading(false);
        }
      }}
    >
      <Eye className="mr-1.5 h-3.5 w-3.5" />
      Show
    </Button>
  );
}
