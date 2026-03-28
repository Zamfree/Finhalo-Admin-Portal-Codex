"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type FinanceRouteTabsProps = {
  labels: {
    withdrawals: string;
    ledger: string;
    adjustments: string;
    reconciliation: string;
  };
};

const FINANCE_ROUTE_TABS = [
  { key: "withdrawals", href: "/admin/finance/withdrawals" },
  { key: "ledger", href: "/admin/finance/ledger" },
  { key: "adjustments", href: "/admin/finance/adjustments" },
  { key: "reconciliation", href: "/admin/finance/reconciliation" },
] as const;

function isActiveTab(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FinanceRouteTabs({ labels }: FinanceRouteTabsProps) {
  const pathname = usePathname();

  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1 md:grid-cols-4">
      {FINANCE_ROUTE_TABS.map((tab) => {
        const isActive = isActiveTab(pathname, tab.href);
        const label = labels[tab.key];

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex h-10 items-center justify-center rounded-lg px-3 text-center text-xs font-semibold uppercase tracking-[0.12em] transition ${
              isActive
                ? "bg-white/[0.1] text-white"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
