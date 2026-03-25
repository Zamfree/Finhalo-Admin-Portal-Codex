import { DataPanel } from "@/components/system/data/data-panel";

import type { TradingAccountRecord } from "../_types";

function roleValue(value?: string | null) {
  return value ?? "—";
}

export function AccountHistoryTab({
  account,
  t,
}: {
  account: TradingAccountRecord;
  t: (key: string) => string;
}) {
  const history = [...account.relationship_history].sort((left, right) => {
    if (left.is_current !== right.is_current) {
      return left.is_current ? -1 : 1;
    }

    return new Date(right.effective_from).getTime() - new Date(left.effective_from).getTime();
  });

  return (
    <DataPanel
      title={
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {t("account.snapshotHistory")}
        </h3>
      }
    >
      <div className="space-y-4">
        {history.map((snapshot) => (
          <div key={snapshot.relationship_snapshot_id} className="rounded-2xl bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-mono text-sm text-white">{snapshot.relationship_snapshot_id}</p>
                <p className="font-mono text-xs text-zinc-500">{snapshot.snapshot_code}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                {snapshot.is_current ? t("common.labels.current") : t("common.labels.historical")}
              </p>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
              <div className="space-y-1">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t("account.relationshipRoles")}
                </dt>
                <dd className="text-zinc-300">
                  {t("account.trader")}: {snapshot.trader_display_name} → {t("account.l1Ib")}:{" "}
                  {snapshot.l1_ib_display_name ?? roleValue(snapshot.l1_ib_id)} → {t("account.l2Ib")}:{" "}
                  {snapshot.l2_ib_display_name ?? roleValue(snapshot.l2_ib_id)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t("common.labels.relationshipDepth")}
                </dt>
                <dd className="text-zinc-300">{snapshot.relationship_depth}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t("common.labels.effectiveFrom")}
                </dt>
                <dd className="text-zinc-300">{new Date(snapshot.effective_from).toLocaleString()}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t("common.labels.effectiveTo")}
                </dt>
                <dd className="text-zinc-300">
                  {snapshot.effective_to
                    ? new Date(snapshot.effective_to).toLocaleString()
                    : t("common.labels.current")}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </DataPanel>
  );
}
