import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";

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
        <ReturnContextLink href={`/admin/users/${account.user_id}`}>
          <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
        </ReturnContextLink>
        <ReturnContextLink
          href="/admin/commission"
          query={{ account_id: account.account_id }}
        >
          <AdminButton variant="secondary">{t("common.actions.viewCommission")}</AdminButton>
        </ReturnContextLink>
        <ReturnContextLink
          href="/admin/finance/ledger"
          query={{ account_id: account.account_id }}
        >
          <AdminButton variant="primary">{t("common.actions.viewFinance")}</AdminButton>
        </ReturnContextLink>
      </div>
    </DataPanel>
  );
}
