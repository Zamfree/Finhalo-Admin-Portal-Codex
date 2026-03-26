"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SidebarItemProps = {
  href: string;
  label: string;
  isActive?: boolean;
  icon?: LucideIcon;
};

export function SidebarItem({ href, label, isActive = false, icon: Icon }: SidebarItemProps) {
  return (
    <Link
      href={href}
      data-active={isActive ? "true" : "false"}
      className={cn(
        "admin-interactive admin-sidebar-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "text-zinc-400 hover:text-zinc-100"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-all duration-150",
          isActive
            ? "bg-sky-300/90 opacity-100"
            : "bg-transparent opacity-0 group-hover:bg-white/50 group-hover:opacity-40"
        )}
      />

      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-200"
          )}
        />
      )}

      <span className="truncate text-[13px] tracking-[0.01em]">{label}</span>
    </Link>
  );
}
