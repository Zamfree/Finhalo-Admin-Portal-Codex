import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

import { MOCK_ACCOUNT_ACTIVITY_SUMMARY, MOCK_TRADING_ACCOUNTS } from "../_mock-data";
import { SummaryCard } from "../_shared";

function getSnapshotStatusClass(
  status: (typeof MOCK_TRADING_ACCOUNTS)[number]["relationship_snapshot_status"]
) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  return "bg-zinc-500/10 text-zinc-300";
}

function getRoleValue(value?: string | null) {
  return value ?? "—";
}

function sortRelationshipHistory(history: (typeof MOCK_TRADING_ACCOUNTS)[number]["relationship_history"]) {
  return [...history].sort((left, right) => {
    if (left.is_current !== right.is_current) {
      return left.is_current ? -1 : 1;
    }

    return new Date(right.effective_from).getTime() - new Date(left.effective_from).getTime();
  });
}

type AccountDetailProps = {
  params: Promise<{ account_id: string }>;
  searchParams?: Promise<{ snapshot_id?: string }>;
};

export default async function AccountDetailPage({ params, searchParams }: AccountDetailProps) {
  const { translations } = await getAdminServerPreferences();
  const t = translations.account;
  const c = translations.common;
  const { account_id } = await params;
  const { snapshot_id } = searchParams ? await searchParams : { snapshot_id: undefined };
  const account = MOCK_TRADING_ACCOUNTS.find((row) => row.account_id === account_id);

  if (!account) {
    notFound();
  }

  const relatedActivity = MOCK_ACCOUNT_ACTIVITY_SUMMARY[account.account_id] ?? {
    commission_records: 0,
    rebate_records: 0,
    finance_entries: 0,
    withdrawals: 0,
  };

  const sortedRelationshipHistory = sortRelationshipHistory(account.relationship_history);

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Accounts
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {account.account_id}
          <span className="ml-1.5 inline-block text-cyan-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.description}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{c.labels.overview}</h2>}
            description={<p className="max-w-2xl text-sm text-zinc-400">{t.overviewDescription}</p>}
          >
            <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {c.labels.accountId}
                </dt>
                <dd className="mt-2 font-mono text-zinc-200">{account.account_id}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {c.labels.broker}
                </dt>
                <dd className="mt-2 text-zinc-200">{account.broker}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t.accountType}
                </dt>
                <dd className="mt-2 text-zinc-200 capitalize">{account.account_type}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {c.labels.status}
                </dt>
                <dd className="mt-2 text-zinc-200 capitalize">{account.status}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t.owner}
                </dt>
                <dd className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-white">{account.user_display_name}</p>
                  <p className="text-zinc-200">{account.user_email}</p>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t.userId}
                </dt>
                <dd className="mt-2 font-mono text-zinc-200">{account.user_id}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t.traderUserIdOnAccount}
                </dt>
                <dd className="mt-2 font-mono text-zinc-200">{account.trader_user_id}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {c.labels.createdAt}
                </dt>
                <dd className="mt-2 text-zinc-200">{new Date(account.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          </DataPanel>

          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{t.snapshotHistory}</h2>}
            description={
              <p className="max-w-3xl text-sm text-zinc-400">
                {t.historyDescription}
                {snapshot_id ? ` ${t.historyHighlightedSuffix}` : ""}
              </p>
            }
          >
            <div className="space-y-4">
              {sortedRelationshipHistory.map((snapshot) => (
                <div
                  key={snapshot.relationship_snapshot_id}
                  className={`rounded-2xl border p-4 ${
                    snapshot.relationship_snapshot_id === snapshot_id
                      ? "border-cyan-400/40 bg-cyan-500/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-sm text-white">{snapshot.relationship_snapshot_id}</p>
                      <p className="font-mono text-xs text-zinc-500">{snapshot.snapshot_code}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getSnapshotStatusClass(
                          snapshot.snapshot_status
                        )}`}
                      >
                        {snapshot.snapshot_status}
                      </span>
                      <span className="inline-flex rounded-full bg-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300">
                        {snapshot.is_current ? c.labels.current : c.labels.historical}
                      </span>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.relationshipRoles}
                      </dt>
                      <dd className="mt-1 text-zinc-200">
                        {t.trader}: {snapshot.trader_display_name} · {t.l1Ib}:{" "}
                        {snapshot.l1_ib_display_name ?? getRoleValue(snapshot.l1_ib_id)} · {t.l2Ib}:{" "}
                        {snapshot.l2_ib_display_name ?? getRoleValue(snapshot.l2_ib_id)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {c.labels.relationshipDepth}
                      </dt>
                      <dd className="mt-1 text-zinc-200">{snapshot.relationship_depth}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {c.labels.effectiveFrom}
                      </dt>
                      <dd className="mt-1 text-zinc-200">{new Date(snapshot.effective_from).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {c.labels.effectiveTo}
                      </dt>
                      <dd className="mt-1 text-zinc-200">
                        {snapshot.effective_to
                          ? new Date(snapshot.effective_to).toLocaleString()
                          : c.labels.current}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </DataPanel>
        </div>

        <div className="space-y-6">
          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{t.relationshipSnapshot}</h2>}
            description={<p className="text-sm text-zinc-400">{t.relationshipDescription}</p>}
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t.relationshipRoles}
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.trader}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">{account.trader_display_name}</p>
                      <p className="text-xs text-zinc-500">{account.user_email}</p>
                      <p className="font-mono text-xs text-zinc-500">{account.trader_user_id}</p>
                    </div>
                    <Link href={`/admin/users/${account.user_id}`} className="admin-link-action text-xs">
                      {c.actions.viewUser}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.l1Ib}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {account.l1_ib_display_name ?? getRoleValue(account.l1_ib_id)}
                      </p>
                      {account.l1_ib_id ? (
                        <p className="font-mono text-xs text-zinc-500">{account.l1_ib_id}</p>
                      ) : null}
                    </div>
                    {account.l1_ib_id ? (
                      <Link
                        href={`/admin/network?ib_user_id=${encodeURIComponent(account.l1_ib_id)}`}
                        className="admin-link-action text-xs"
                      >
                        {c.actions.viewCoverage}
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.l2Ib}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {account.l2_ib_display_name ?? getRoleValue(account.l2_ib_id)}
                      </p>
                      {account.l2_ib_id ? (
                        <p className="font-mono text-xs text-zinc-500">{account.l2_ib_id}</p>
                      ) : null}
                    </div>
                    {account.l2_ib_id ? (
                      <Link
                        href={`/admin/network?ib_user_id=${encodeURIComponent(account.l2_ib_id)}`}
                        className="admin-link-action text-xs"
                      >
                        {c.actions.viewCoverage}
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {c.labels.snapshotId}
                  </dt>
                  <dd className="mt-2 font-mono text-zinc-200">{account.relationship_snapshot_id}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {c.labels.snapshotCode}
                  </dt>
                  <dd className="mt-2 font-mono text-zinc-200">{account.snapshot_code}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {c.labels.snapshotStatus}
                  </dt>
                  <dd className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getSnapshotStatusClass(
                        account.relationship_snapshot_status
                      )}`}
                    >
                      {account.relationship_snapshot_status}
                    </span>
                    <span className="inline-flex rounded-full bg-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300">
                      {account.relationship_is_current
                        ? c.labels.currentSnapshot
                        : c.labels.historicalSnapshot}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {c.labels.relationshipDepth}
                  </dt>
                  <dd className="mt-2 text-zinc-200">{account.relationship_depth}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {c.labels.effectiveFrom}
                  </dt>
                  <dd className="mt-2 text-zinc-200">
                    {new Date(account.relationship_effective_from).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {c.labels.effectiveTo}
                  </dt>
                  <dd className="mt-2 text-zinc-200">
                    {account.relationship_effective_to
                      ? new Date(account.relationship_effective_to).toLocaleString()
                      : c.labels.current}
                  </dd>
                </div>
              </dl>
            </div>
          </DataPanel>

          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{t.relatedActivity}</h2>}
            description={<p className="text-sm text-zinc-400">{t.activityDescription}</p>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label={t.commissionCount} value={relatedActivity.commission_records} emphasis="strong" />
              <SummaryCard label={t.rebateCount} value={relatedActivity.rebate_records} />
              <SummaryCard label={t.financeCount} value={relatedActivity.finance_entries} />
              <SummaryCard label={t.withdrawalCount} value={relatedActivity.withdrawals} />
            </div>
          </DataPanel>

          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{c.labels.handoff}</h2>}
            description={<p className="text-sm text-zinc-400">{t.handoffDescription}</p>}
          >
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/users/${account.user_id}`}>
                <AdminButton variant="ghost" className="h-11 px-5">
                  {c.actions.viewUser}
                </AdminButton>
              </Link>
              <Link href={`/admin/commission?account_id=${encodeURIComponent(account.account_id)}`}>
                <AdminButton variant="secondary" className="h-11 px-5">
                  {c.actions.viewCommission}
                </AdminButton>
              </Link>
              <Link href={`/admin/finance/ledger?account_id=${encodeURIComponent(account.account_id)}`}>
                <AdminButton variant="primary" className="h-11 px-5">
                  {c.actions.viewFinance}
                </AdminButton>
              </Link>
            </div>
          </DataPanel>
        </div>
      </div>
    </div>
  );
}
