import type { ReactNode } from "react";

export function UnavailableHint({ children }: { children: ReactNode }) {
  return (
    <p className="break-words text-xs text-zinc-500" role="status" aria-live="polite">
      {children}
    </p>
  );
}
