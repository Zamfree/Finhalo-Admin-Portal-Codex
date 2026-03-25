"use client";

import { usePathname } from "next/navigation";
import { SidebarBrand } from "@/components/system/layout/sidebar/sidebar-brand";
import { SidebarItem } from "@/components/system/layout/sidebar/sidebar-item";
import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";

const NAV_GROUPS = [
  {
    label: "CORE",
    items: [
      { key: "common.nav.dashboard", href: "/admin/dashboard" },
    ],
  },
  {
    label: "CRM",
    items: [
      { key: "common.nav.users", href: "/admin/users" },
      { key: "common.nav.accounts", href: "/admin/accounts" },
      { key: "common.nav.brokers", href: "/admin/brokers" },
      { key: "common.nav.network", href: "/admin/network" },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { key: "common.nav.commission", href: "/admin/commission" },
      { key: "common.nav.finance", href: "/admin/finance" },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { key: "common.nav.referral", href: "/admin/referral" },
      { key: "common.nav.campaigns", href: "/admin/campaigns" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { key: "common.nav.support", href: "/admin/support" },
      { key: "common.nav.settings", href: "/admin/settings" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useAdminPreferences();

  return (
    <aside className="admin-sidebar flex h-screen w-[260px] flex-col px-4 py-6">
      <div className="mb-10 px-1">
        <SidebarBrand />
      </div>


      <nav className="flex flex-col gap-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500/80">
              {group.label}
            </p>

            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      <div className="admin-surface-soft mt-auto p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{t("common.shell.environment")}</p>
        <p className="mt-1 text-sm font-semibold text-zinc-100">{t("common.shell.previewMode")}</p>
      </div>
    </aside>
  );
}
