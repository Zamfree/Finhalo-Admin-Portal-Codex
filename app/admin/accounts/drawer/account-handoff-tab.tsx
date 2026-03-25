import Link from "next/link";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";

import type { TradingAccountRecord } from "../_types";

export function AccountHandoffTab({
  account,
  t,
}: {
  account: TradingAccountRecord;
  t: (key: string) => string;
}) {
  return (
    <DataPanel
      title={
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {t("common.labels.handoff")}
        </h3>
      }
    >
      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/users/${account.user_id}`}>
          <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
        </Link>
        <Link href={`/admin/commission?account_id=${encodeURIComponent(account.account_id)}`}>
          <AdminButton variant="secondary">{t("common.actions.viewCommission")}</AdminButton>
        </Link>
        <Link href={`/admin/finance/ledger?account_id=${encodeURIComponent(account.account_id)}`}>
          <AdminButton variant="primary">{t("common.actions.viewFinance")}</AdminButton>
        </Link>
      </div>
    </DataPanel>
  );
}
