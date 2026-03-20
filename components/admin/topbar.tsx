"use client";

import { usePathname } from "next/navigation";

function getTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    return "Admin";
  }

  const section = segments[1];

  if (section === "ib") {
    return "IB Network";
  }

  return section.charAt(0).toUpperCase() + section.slice(1);
}

export function AdminTopbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/5 bg-[#0B0F14]/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 shadow-sm">
        <h1 className="text-base font-semibold text-slate-100">{getTitle(pathname)}</h1>
        <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Admin</span>
      </div>
    </header>
  );
}
