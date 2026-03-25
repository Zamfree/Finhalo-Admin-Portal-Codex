import Link from "next/link";

import { DataPanel } from "@/components/system/data/data-panel";

import type { TradingAccountRecord } from "../_types";

function roleValue(value?: string | null) {
  return value ?? "—";
}

export function AccountRelationshipTab({
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
          {t("account.relationshipSnapshot")}
        </h3>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("account.relationshipRoles")}
          </p>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t("account.trader")}
                </p>
                <p className="text-sm font-medium text-white">{account.trader_display_name}</p>
                <p className="text-xs text-zinc-500">{account.user_email}</p>
                <p className="font-mono text-xs text-zinc-500">{account.trader_user_id}</p>
              </div>
              <Link
                href={`/admin/users/${account.user_id}`}
                className="admin-link-action inline-flex items-center gap-1 text-xs"
              >
                {t("common.actions.viewUser")}
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t("account.l1Ib")}
                </p>
                <p className="text-sm font-medium text-white">
                  {account.l1_ib_display_name ?? roleValue(account.l1_ib_id)}
                </p>
                {account.l1_ib_id ? (
                  <p className="font-mono text-xs text-zinc-500">{account.l1_ib_id}</p>
                ) : null}
              </div>
              {account.l1_ib_id ? (
                <Link
                  href={`/admin/network?ib_user_id=${encodeURIComponent(account.l1_ib_id)}`}
                  className="admin-link-action inline-flex items-center gap-1 text-xs"
                >
                  {t("common.actions.viewCoverage")}
                </Link>
              ) : (
                <span className="text-xs text-zinc-500">—</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t("account.l2Ib")}
                </p>
                <p className="text-sm font-medium text-white">
                  {account.l2_ib_display_name ?? roleValue(account.l2_ib_id)}
                </p>
                {account.l2_ib_id ? (
                  <p className="font-mono text-xs text-zinc-500">{account.l2_ib_id}</p>
                ) : null}
              </div>
              {account.l2_ib_id ? (
                <Link
                  href={`/admin/network?ib_user_id=${encodeURIComponent(account.l2_ib_id)}`}
                  className="admin-link-action inline-flex items-center gap-1 text-xs"
                >
                  {t("common.actions.viewCoverage")}
                </Link>
              ) : (
                <span className="text-xs text-zinc-500">—</span>
              )}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div className="space-y-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("common.labels.snapshotId")}
            </dt>
            <dd className="font-mono text-sm text-zinc-300">{account.relationship_snapshot_id}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("common.labels.snapshotCode")}
            </dt>
            <dd className="font-mono text-sm text-zinc-300">{account.snapshot_code}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("common.labels.relationshipDepth")}
            </dt>
            <dd className="text-sm text-zinc-300">{account.relationship_depth}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("common.labels.snapshotStatus")}
            </dt>
            <dd className="text-sm text-zinc-300">{account.relationship_snapshot_status}</dd>
          </div>
        </dl>
      </div>
    </DataPanel>
  );
}
