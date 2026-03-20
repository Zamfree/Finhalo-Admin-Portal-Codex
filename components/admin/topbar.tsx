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
    <header className="relative z-10 px-6 pt-6 md:px-10">
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#121212]/90 px-5 py-3 backdrop-blur-xl">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Admin Portal</p>
          <h2 className="mt-1 text-base font-semibold text-white">{getTitle(pathname)}</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 md:block"
          >
            Alerts
          </button>
          <div className="flex h-10 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs text-zinc-300">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white">AK</span>
            Admin
          </div>
        </div>
      </div>
    </header>
  );
}
