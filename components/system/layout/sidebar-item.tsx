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
      className={`block rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
        isActive
          ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_6px_18px_rgba(0,0,0,0.18)]"
          : "text-zinc-400 hover:bg-white/[0.05] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_4px_14px_rgba(0,0,0,0.12)]"
      }`}
    >
      {label}
    </Link>
  );
}