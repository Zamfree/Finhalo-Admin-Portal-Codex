import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";

export function SearchSummaryCard({
  label,
  value,
  emphasis = "default",
}: {
  label: string;
  value: ReactNode;
  emphasis?: "default" | "strong";
}) {
  return (
    <div className="admin-surface-soft rounded-2xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className={`mt-2 font-semibold tabular-nums ${emphasis === "strong" ? "text-xl text-white" : "text-lg text-zinc-200"}`}>
        {value}
      </p>
    </div>
  );
}

export function SearchResultPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <DataPanel
      title={<h2 className="text-xl font-semibold text-white">{title}</h2>}
      description={<p className="max-w-3xl break-words text-sm text-zinc-400">{description}</p>}
    >
      {children}
    </DataPanel>
  );
}

export function SearchResultList({ children }: { children: ReactNode }) {
  return <ul className="space-y-3 text-sm">{children}</ul>;
}

export function SearchResultItem({
  href,
  primary,
  secondary,
}: {
  href: string;
  primary: ReactNode;
  secondary: ReactNode;
}) {
  return (
    <li className="admin-surface-soft rounded-2xl p-4">
      <ReturnContextLink href={href} className="block transition hover:text-white">
        <p className="break-words text-sm font-medium text-white">{primary}</p>
        <p className="mt-1 break-words text-sm text-zinc-400">{secondary}</p>
      </ReturnContextLink>
    </li>
  );
}

export function SearchEmptyState({ label }: { label: string }) {
  return (
    <div className="admin-surface-soft rounded-2xl px-4 py-5 text-sm text-zinc-500" role="status" aria-live="polite">
      No matching {label.toLowerCase()} found for the current search.
    </div>
  );
}
