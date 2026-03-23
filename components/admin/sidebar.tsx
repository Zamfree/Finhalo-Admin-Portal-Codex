"use client";

import { usePathname } from "next/navigation";

import { SidebarItem } from "@/components/system/layout/sidebar-item";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";

const NAV_ITEMS = [
  { key: "common.nav.dashboard", href: "/admin/dashboard" },
  { key: "common.nav.users", href: "/admin/users" },
  { key: "common.nav.accounts", href: "/admin/accounts" },
  { key: "common.nav.brokers", href: "/admin/brokers" },
  { key: "common.nav.commission", href: "/admin/commission" },
  { key: "common.nav.finance", href: "/admin/finance" },
  { key: "common.nav.network", href: "/admin/network" },
  { key: "common.nav.referral", href: "/admin/referral" },
  { key: "common.nav.campaigns", href: "/admin/campaigns" },
  { key: "common.nav.support", href: "/admin/support" },
  { key: "common.nav.settings", href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useAdminPreferences();

  return (
    <aside className="admin-sidebar hidden w-72 shrink-0 px-6 py-8 md:flex md:flex-col">
      <div className="mb-10 px-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Finhalo</p>
        <h1 className="text-xl font-bold tracking-wide text-white">
          Admin<span className="text-emerald-400">.</span>
        </h1>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={t(item.key)}
              isActive={isActive}
            />
          );
        })}
      </nav>

      <div className="admin-surface-soft mt-auto p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{t("common.shell.environment")}</p>
        <p className="mt-1 text-sm font-semibold text-zinc-100">{t("common.shell.previewMode")}</p>
      </div>
    </aside>
  );
}
