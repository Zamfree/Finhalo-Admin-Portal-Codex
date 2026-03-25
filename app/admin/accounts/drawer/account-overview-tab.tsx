import { DataPanel } from "@/components/system/data/data-panel";

import type { TradingAccountRecord } from "../_types";

export function AccountOverviewTab({
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
          {t("common.labels.overview")}
        </h3>
      }
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("common.labels.accountId")}
          </dt>
          <dd className="font-mono text-sm text-zinc-300">{account.account_id}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("common.labels.broker")}
          </dt>
          <dd className="text-sm text-white">{account.broker}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("account.accountType")}
          </dt>
          <dd className="text-sm uppercase text-zinc-300">{account.account_type}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("common.labels.status")}
          </dt>
          <dd className="text-sm text-zinc-300">{account.status}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("account.owner")}
          </dt>
          <dd className="space-y-1">
            <p className="text-sm font-medium text-white">{account.user_display_name}</p>
            <p className="text-xs text-zinc-500">{account.user_email}</p>
          </dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("account.userId")}
          </dt>
          <dd className="font-mono text-sm text-zinc-300">{account.user_id}</dd>
        </div>
      </dl>
    </DataPanel>
  );
}
