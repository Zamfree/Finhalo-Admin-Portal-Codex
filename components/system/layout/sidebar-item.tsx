"use client";

import Link from "next/link";

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
      className={`block rounded-2xl border border-transparent px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
        isActive
          ? "bg-white/[0.06] text-white"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
