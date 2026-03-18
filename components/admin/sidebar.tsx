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
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="border-b px-4 py-4 text-sm font-semibold">Finhalo Admin</div>
      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
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
