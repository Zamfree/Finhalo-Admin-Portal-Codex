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
    <aside className="hidden w-72 shrink-0 border-r border-white/5 bg-[#0D1117] px-3 py-4 md:block">
      <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Finhalo</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">Admin Portal</p>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg border px-3 py-2 text-sm transition ${
                isActive
                  ? "border-white/10 bg-white/10 text-white shadow-sm"
                  : "border-transparent text-slate-400 hover:border-white/5 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
