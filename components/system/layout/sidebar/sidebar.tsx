"use client";

import { usePathname } from "next/navigation";
import { SidebarBrand } from "@/components/system/layout/sidebar/sidebar-brand";
import { SidebarItem } from "@/components/system/layout/sidebar/sidebar-item";
import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";

const NAV_GROUPS = [
  {
    labelKey: "common.navGroups.core",
    items: [
      { key: "common.nav.dashboard", href: "/admin/dashboard" },
    ],
  },
  {
    labelKey: "common.navGroups.crm",
    items: [
      { key: "common.nav.users", href: "/admin/users" },
      { key: "common.nav.accounts", href: "/admin/accounts" },
      { key: "common.nav.brokers", href: "/admin/brokers" },
      { key: "common.nav.network", href: "/admin/network" },
    ],
  },
  {
    labelKey: "common.navGroups.finance",
    items: [
      { key: "common.nav.commission", href: "/admin/commission" },
      { key: "common.nav.finance", href: "/admin/finance" },
    ],
  },
  {
    labelKey: "common.navGroups.growth",
    items: [
      { key: "common.nav.referral", href: "/admin/referral" },
      { key: "common.nav.campaigns", href: "/admin/campaigns" },
    ],
  },
  {
    labelKey: "common.navGroups.system",
    items: [
      { key: "common.nav.support", href: "/admin/support" },
      { key: "common.nav.settings", href: "/admin/settings" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useAdminPreferences();

  function isNavItemActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="admin-sidebar flex h-full w-[272px] shrink-0 flex-col px-4 py-5">
      <div className="mb-8 shrink-0 px-1">
        <SidebarBrand subtitle={t("common.shell.adminPortal")} />
      </div>

      <nav className="flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.labelKey} className="space-y-1">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500/80">
                {t(group.labelKey)}
              </p>

              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const isActive = isNavItemActive(item.href);
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
        </div>
      </nav>

      <div className="admin-surface-soft mt-5 shrink-0 p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
          {t("common.shell.environment")}
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-100">{t("common.shell.previewMode")}</p>
      </div>
    </aside>
  );
}
