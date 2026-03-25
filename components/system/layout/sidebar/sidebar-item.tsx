"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  href: string;
  label: string;
  isActive?: boolean;
};

export function SidebarItem({ href, label, isActive = false }: SidebarItemProps) {
  return (
    <Link
      href={href}
      data-active={isActive ? "true" : "false"}
      className={cn(
        "admin-interactive block rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        isActive
          ? "text-white"
          : "text-zinc-400"
      )}
    >
      {label}
    </Link>
  );
}