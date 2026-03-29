import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import {
  getAdminAccountActivitySummary,
  getAdminAccountById,
} from "@/services/admin/accounts.service";

import { SummaryCard } from "../_shared";
import type { TradingAccountRecord } from "../_types";

function getSnapshotStatusClass(status: TradingAccountRecord["relationship_snapshot_status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  return "bg-zinc-500/10 text-zinc-300";
}

function getRoleValue(value?: string | null) {
  return value ?? "—";
}

function sortRelationshipHistory(history: TradingAccountRecord["relationship_history"]) {
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
  const account = await getAdminAccountById(account_id);

  if (!account) {
    notFound();
  }

  const relatedActivity = await getAdminAccountActivitySummary(account.account_id);
  const sortedRelationshipHistory = sortRelationshipHistory(account.relationship_history);

  return (
    <div className="space-y-6 pb-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Admin / Accounts
          </p>
          <ReturnToContextButton
            fallbackPath="/admin/accounts"
            label="Back to Accounts"
            variant="ghost"
            className="px-3 py-2"
          />
        </div>
        <h1 className="break-all text-4xl font-bold tracking-tight text-white md:text-5xl">
          {account.account_id}
          <span className="ml-1.5 inline-block text-cyan-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl break-words text-base text-zinc-400 md:text-lg">
          {t.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ReturnContextLink href={`/admin/users/${account.user_id}`}>
            <AdminButton variant="ghost" className="h-10 px-4">
              {c.actions.viewUser}
            </AdminButton>
          </ReturnContextLink>
          <ReturnContextLink href="/admin/commission" query={{ query: account.account_id }}>
            <AdminButton variant="secondary" className="h-10 px-4">
              {c.actions.viewCommission}
            </AdminButton>
          </ReturnContextLink>
          <ReturnContextLink href="/admin/finance/ledger" query={{ account_id: account.account_id }}>
            <AdminButton variant="primary" className="h-10 px-4">
              {c.actions.viewFinance}
            </AdminButton>
          </ReturnContextLink>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{c.labels.overview}</h2>}
            description={<p className="max-w-2xl break-words text-sm text-zinc-400">{t.overviewDescription}</p>}
          >
            <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <DetailField label={c.labels.accountId} value={account.account_id} mono />
              <DetailField label={c.labels.broker} value={account.broker} />
              <DetailField label={t.accountType} value={account.account_type} className="capitalize" />
              <DetailField label={c.labels.status} value={account.status} className="capitalize" />
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t.owner}
                </dt>
                <dd className="mt-2 min-w-0 space-y-1">
                  <p className="break-words text-sm font-medium text-white">{account.user_display_name}</p>
                  <p className="break-all text-zinc-200">{account.user_email}</p>
                </dd>
              </div>
              <DetailField label={t.userId} value={account.user_id} mono />
              <DetailField label={t.traderUserIdOnAccount} value={account.trader_user_id} mono />
              <DetailField
                label={c.labels.createdAt}
                value={new Date(account.created_at).toLocaleString()}
              />
            </dl>
          </DataPanel>

          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{t.snapshotHistory}</h2>}
            description={
              <p className="max-w-3xl break-words text-sm text-zinc-400">
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
                    <div className="min-w-0 space-y-1">
                      <p className="break-all font-mono text-sm text-white">
                        {snapshot.relationship_snapshot_id}
                      </p>
                      <p className="break-all font-mono text-xs text-zinc-500">{snapshot.snapshot_code}</p>
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
                    <DetailField
                      label={t.relationshipRoles}
                      value={
                        <>
                          {t.trader}: {snapshot.trader_display_name} {"->"} {t.l1Ib}:{" "}
                          {snapshot.l1_ib_display_name ?? getRoleValue(snapshot.l1_ib_id)} {"->"} {t.l2Ib}:{" "}
                          {snapshot.l2_ib_display_name ?? getRoleValue(snapshot.l2_ib_id)}
                        </>
                      }
                    />
                    <DetailField label={c.labels.relationshipDepth} value={snapshot.relationship_depth} />
                    <DetailField
                      label={c.labels.effectiveFrom}
                      value={new Date(snapshot.effective_from).toLocaleString()}
                    />
                    <DetailField
                      label={c.labels.effectiveTo}
                      value={
                        snapshot.effective_to
                          ? new Date(snapshot.effective_to).toLocaleString()
                          : c.labels.current
                      }
                    />
                  </dl>
                </div>
              ))}
            </div>
          </DataPanel>
        </div>

        <div className="space-y-6">
          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{t.relationshipSnapshot}</h2>}
            description={<p className="break-words text-sm text-zinc-400">{t.relationshipDescription}</p>}
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t.relationshipRoles}
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.trader}
                      </p>
                      <p className="mt-1 break-words text-sm font-medium text-white">
                        {account.trader_display_name}
                      </p>
                      <p className="break-all text-xs text-zinc-500">{account.user_email}</p>
                      <p className="break-all font-mono text-xs text-zinc-500">{account.trader_user_id}</p>
                    </div>
                    <ReturnContextLink href={`/admin/users/${account.user_id}`} className="admin-link-action text-xs">
                      {c.actions.viewUser}
                    </ReturnContextLink>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.l1Ib}
                      </p>
                      <p className="mt-1 break-words text-sm font-medium text-white">
                        {account.l1_ib_display_name ?? getRoleValue(account.l1_ib_id)}
                      </p>
                      {account.l1_ib_id ? (
                        <p className="break-all font-mono text-xs text-zinc-500">{account.l1_ib_id}</p>
                      ) : null}
                    </div>
                    {account.l1_ib_id ? (
                      <ReturnContextLink
                        href="/admin/network"
                        query={{ ib_user_id: account.l1_ib_id }}
                        className="admin-link-action text-xs"
                      >
                        {c.actions.viewCoverage}
                      </ReturnContextLink>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.l2Ib}
                      </p>
                      <p className="mt-1 break-words text-sm font-medium text-white">
                        {account.l2_ib_display_name ?? getRoleValue(account.l2_ib_id)}
                      </p>
                      {account.l2_ib_id ? (
                        <p className="break-all font-mono text-xs text-zinc-500">{account.l2_ib_id}</p>
                      ) : null}
                    </div>
                    {account.l2_ib_id ? (
                      <ReturnContextLink
                        href="/admin/network"
                        query={{ ib_user_id: account.l2_ib_id }}
                        className="admin-link-action text-xs"
                      >
                        {c.actions.viewCoverage}
                      </ReturnContextLink>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 text-sm">
                <DetailField label={c.labels.snapshotId} value={account.relationship_snapshot_id} mono />
                <DetailField label={c.labels.snapshotCode} value={account.snapshot_code} mono />
                <div className="min-w-0">
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
                <DetailField label={c.labels.relationshipDepth} value={account.relationship_depth} />
                <DetailField
                  label={c.labels.effectiveFrom}
                  value={new Date(account.relationship_effective_from).toLocaleString()}
                />
                <DetailField
                  label={c.labels.effectiveTo}
                  value={
                    account.relationship_effective_to
                      ? new Date(account.relationship_effective_to).toLocaleString()
                      : c.labels.current
                  }
                />
              </dl>
            </div>
          </DataPanel>

          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">{t.relatedActivity}</h2>}
            description={<p className="break-words text-sm text-zinc-400">{t.activityDescription}</p>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label={t.commissionCount} value={relatedActivity.commission_records} emphasis="strong" />
              <SummaryCard label={t.rebateCount} value={relatedActivity.rebate_records} />
              <SummaryCard label={t.financeCount} value={relatedActivity.finance_entries} />
              <SummaryCard label={t.withdrawalCount} value={relatedActivity.withdrawals} />
            </div>
          </DataPanel>

        </div>
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd
        className={`mt-2 min-w-0 ${mono ? "break-all font-mono text-zinc-200" : "break-words text-zinc-200"} ${
          className ?? ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
