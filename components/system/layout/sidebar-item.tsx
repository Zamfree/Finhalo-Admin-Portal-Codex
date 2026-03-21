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
      className={`admin-interactive block rounded-xl px-3 py-2 text-sm ${
        isActive
          ? "bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.16)]"
          : "border border-transparent text-zinc-400 hover:bg-white/[0.07] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.02),0_10px_24px_rgba(0,0,0,0.14)]"
      }`}
    >
      {label}
    </Link>
  );
}
