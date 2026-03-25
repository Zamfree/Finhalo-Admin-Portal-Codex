import { DataPanel } from "@/components/system/data/data-panel";

import type { TradingAccountRelatedActivity } from "../_types";

export function AccountActivityTab({
  activity,
  t,
}: {
  activity: TradingAccountRelatedActivity;
  t: (key: string) => string;
}) {
  return (
    <DataPanel
      title={
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {t("account.relatedActivity")}
        </h3>
      }
    >
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("account.commissionCount")}
          </dt>
          <dd className="text-lg font-semibold text-white">{activity.commission_records}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("account.rebateCount")}
          </dt>
          <dd className="text-lg font-semibold text-white">{activity.rebate_records}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("account.financeCount")}
          </dt>
          <dd className="text-lg font-semibold text-white">{activity.finance_entries}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("account.withdrawalCount")}
          </dt>
          <dd className="text-lg font-semibold text-white">{activity.withdrawals}</dd>
        </div>
      </dl>
    </DataPanel>
  );
}
