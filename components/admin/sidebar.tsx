"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/users" },
  { label: "Commissions", href: "/admin/commissions" },
  { label: "Brokers", href: "/admin/brokers" },
  { label: "Finance", href: "/admin/finance" },
  { label: "IB Network", href: "/admin/ib" },
  { label: "Promotions", href: "/admin/promotions" },
  { label: "Support", href: "/admin/support" },
  { label: "Settings", href: "/admin/settings" },
  { label: "Search", href: "/admin/search" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/5 bg-gradient-to-b from-black to-zinc-950/70 px-6 py-8 md:flex md:flex-col">
      <div className="mb-10 px-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Finhalo</p>
        <h1 className="text-xl font-bold tracking-wide text-white">
          Admin<span className="text-emerald-400">.</span>
        </h1>
      </div>

      <nav className="space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm transition-all ${
                isActive
                  ? "border border-white/10 bg-white/10 font-semibold text-white"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Environment</p>
        <p className="mt-1 text-sm font-semibold text-zinc-100">Preview Mode</p>
      </div>
    </aside>
  );
}
