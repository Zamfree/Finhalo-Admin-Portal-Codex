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
      className={`block rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
        isActive
          ? "border border-white/10 bg-white/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
