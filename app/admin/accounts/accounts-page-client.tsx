"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";

import { MOCK_ACCOUNT_ACTIVITY_SUMMARY } from "./_mock-data";
import type {
  TradingAccountRecord,
  TradingAccountRelationshipSnapshotStatus,
} from "./_types";

function getStatusClass(status: TradingAccountRecord["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "monitoring") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

function getSnapshotStatusClass(status: TradingAccountRelationshipSnapshotStatus) {
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

export function AccountsPageClient({ rows }: { rows: TradingAccountRecord[] }) {
  const { t } = useAdminPreferences();
  const [query, setQuery] = useState("");
  const [broker, setBroker] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState<TradingAccountRecord | null>(null);

  const accountColumns = useMemo<DataTableColumn<TradingAccountRecord>[]>(
    () => [
      {
        key: "account_id",
        header: t("common.labels.accountId"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="font-mono text-sm text-white">{row.account_id}</p>
            <p className="text-xs text-zinc-500">
              {t("common.labels.createdAt")} {new Date(row.created_at).toLocaleDateString()}
            </p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "broker",
        header: `${t("common.labels.broker")} / ${t("account.accountType")}`,
        cell: (row) => (
          <div className="space-y-1">
            <p className="font-medium text-white">{row.broker}</p>
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{row.account_type}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "status",
        header: t("common.labels.status"),
        cell: (row) => (
          <div className="space-y-1">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                row.status
              )}`}
            >
              {row.status}
            </span>
            <p className="font-mono text-xs text-zinc-500">{row.trader_user_id}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "owner",
        header: t("account.owner"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="text-sm text-zinc-300">{row.user_email}</p>
            <p className="font-mono text-xs text-zinc-500">{row.user_id}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "relationship",
        header: t("account.relationshipSnapshot"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="font-mono text-xs text-zinc-400">{row.relationship_snapshot_id}</p>
            <p className="text-xs text-zinc-500">
              {t("account.trader")}: {row.trader_user_id} · {t("account.l1Ib")}:{" "}
              {getRoleValue(row.l1_ib_id)} · {t("account.l2Ib")}: {getRoleValue(row.l2_ib_id)}
            </p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
    ],
    [t]
  );

  const brokers = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((row) => row.broker)))],
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.account_id.toLowerCase().includes(normalizedQuery) ||
        row.user_email.toLowerCase().includes(normalizedQuery) ||
        row.user_id.toLowerCase().includes(normalizedQuery) ||
        row.trader_user_id.toLowerCase().includes(normalizedQuery) ||
        row.relationship_snapshot_id.toLowerCase().includes(normalizedQuery) ||
        row.l1_ib_id?.toLowerCase().includes(normalizedQuery) ||
        row.l2_ib_id?.toLowerCase().includes(normalizedQuery);
      const matchesBroker = broker === "all" || row.broker === broker;
      const matchesStatus = status === "all" || row.status === status;

      return matchesQuery && matchesBroker && matchesStatus;
    });
  }, [broker, query, rows, status]);

  const selectedAccountHistory = useMemo(
    () => (selectedAccount ? sortRelationshipHistory(selectedAccount.relationship_history) : []),
    [selectedAccount]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_220px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("account.traderAccountSearchPlaceholder")}
          className="admin-control h-11 rounded-xl border border-white/10 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
        />
        <select
          value={broker}
          onChange={(event) => setBroker(event.target.value)}
          className="admin-control h-11 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 focus:outline-none"
        >
          {brokers.map((option) => (
            <option key={option} value={option} className="bg-zinc-950 text-zinc-200">
              {option === "all" ? t("common.filters.allBrokers") : option}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="admin-control h-11 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 focus:outline-none"
        >
          <option value="all" className="bg-zinc-950 text-zinc-200">
            {t("common.filters.allStatuses")}
          </option>
          <option value="active" className="bg-zinc-950 text-zinc-200">
            {t("account.active")}
          </option>
          <option value="monitoring" className="bg-zinc-950 text-zinc-200">
            {t("account.monitoring")}
          </option>
          <option value="suspended" className="bg-zinc-950 text-zinc-200">
            {t("account.suspended")}
          </option>
        </select>
      </div>

      <DataTable
        columns={accountColumns}
        rows={filteredRows}
        getRowKey={(row) => row.account_id}
        minWidthClassName="min-w-[1140px]"
        emptyMessage={t("account.noAccounts")}
        onRowClick={(row) => setSelectedAccount(row)}
      />

      <AppDrawer
        open={Boolean(selectedAccount)}
        onOpenChange={(open) => {
          if (!open) setSelectedAccount(null);
        }}
        title={selectedAccount?.account_id ?? t("account.title")}
        width="wide"
      >
        {selectedAccount ? (
          <>
            <DrawerHeader
              title={selectedAccount.account_id}
              description={`${selectedAccount.broker} | ${selectedAccount.account_type}`}
              onClose={() => setSelectedAccount(null)}
            />
            <DrawerDivider />
            <DrawerBody>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
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
                      <dd className="font-mono text-sm text-zinc-300">{selectedAccount.account_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.broker")}
                      </dt>
                      <dd className="text-sm text-white">{selectedAccount.broker}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.accountType")}
                      </dt>
                      <dd className="text-sm uppercase text-zinc-300">{selectedAccount.account_type}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.status")}
                      </dt>
                      <dd>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                            selectedAccount.status
                          )}`}
                        >
                          {selectedAccount.status}
                        </span>
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.owner")}
                      </dt>
                      <dd className="text-sm text-white">{selectedAccount.user_email}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.userId")}
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedAccount.user_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.traderUserIdOnAccount")}
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedAccount.trader_user_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.createdAt")}
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {new Date(selectedAccount.created_at).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("account.relationshipSnapshot")}
                    </h3>
                  }
                >
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.relationshipRoles")}
                      </p>
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                              {t("account.trader")}
                            </p>
                            <p className="text-sm font-medium text-white">{selectedAccount.user_email}</p>
                            <p className="font-mono text-xs text-zinc-500">{selectedAccount.trader_user_id}</p>
                          </div>
                          <Link
                            href={`/admin/users/${selectedAccount.user_id}`}
                            className="admin-link-action inline-flex items-center gap-1 text-xs"
                          >
                            {t("common.actions.viewUser")}
                          </Link>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                              {t("account.l1Ib")}
                            </p>
                            <p className="font-mono text-sm text-zinc-300">{getRoleValue(selectedAccount.l1_ib_id)}</p>
                          </div>
                          {selectedAccount.l1_ib_id ? (
                            <Link
                              href={`/admin/network?ib_user_id=${encodeURIComponent(selectedAccount.l1_ib_id)}`}
                              className="admin-link-action inline-flex items-center gap-1 text-xs"
                            >
                              {t("common.actions.viewCoverage")}
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-500">—</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                              {t("account.l2Ib")}
                            </p>
                            <p className="font-mono text-sm text-zinc-300">{getRoleValue(selectedAccount.l2_ib_id)}</p>
                          </div>
                          {selectedAccount.l2_ib_id ? (
                            <Link
                              href={`/admin/network?ib_user_id=${encodeURIComponent(selectedAccount.l2_ib_id)}`}
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
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedAccount.relationship_snapshot_id}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.snapshotCode")}
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedAccount.snapshot_code}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.snapshotStatus")}
                        </dt>
                        <dd className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getSnapshotStatusClass(
                              selectedAccount.relationship_snapshot_status
                            )}`}
                          >
                            {selectedAccount.relationship_snapshot_status}
                          </span>
                          <span className="inline-flex rounded-full bg-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300">
                            {selectedAccount.relationship_is_current
                              ? t("common.labels.currentSnapshot")
                              : t("common.labels.historicalSnapshot")}
                          </span>
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.relationshipDepth")}
                        </dt>
                        <dd className="text-sm text-zinc-300">{selectedAccount.relationship_depth}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.effectiveFrom")}
                        </dt>
                        <dd className="text-sm text-zinc-300">
                          {new Date(selectedAccount.relationship_effective_from).toLocaleString()}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.effectiveTo")}
                        </dt>
                        <dd className="text-sm text-zinc-300">
                          {selectedAccount.relationship_effective_to
                            ? new Date(selectedAccount.relationship_effective_to).toLocaleString()
                            : t("common.labels.current")}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("account.snapshotHistory")}
                    </h3>
                  }
                  className="lg:col-span-2"
                >
                  <div className="space-y-4">
                    {selectedAccountHistory.map((snapshot) => (
                      <div
                        key={snapshot.relationship_snapshot_id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
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
                              {snapshot.is_current ? t("common.labels.current") : t("common.labels.historical")}
                            </span>
                          </div>
                        </div>
                        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
                          <div className="space-y-1">
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                              {t("account.relationshipRoles")}
                            </dt>
                            <dd className="text-zinc-300">
                              {t("account.trader")}: {snapshot.trader_user_id} · {t("account.l1Ib")}:{" "}
                              {getRoleValue(snapshot.l1_ib_id)} · {t("account.l2Ib")}:{" "}
                              {getRoleValue(snapshot.l2_ib_id)}
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

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("account.relatedActivity")}
                    </h3>
                  }
                  className="lg:col-span-2"
                >
                  <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.commissionCount")}
                      </dt>
                      <dd className="text-lg font-semibold text-white">
                        {MOCK_ACCOUNT_ACTIVITY_SUMMARY[selectedAccount.account_id]?.commission_records ?? 0}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.rebateCount")}
                      </dt>
                      <dd className="text-lg font-semibold text-white">
                        {MOCK_ACCOUNT_ACTIVITY_SUMMARY[selectedAccount.account_id]?.rebate_records ?? 0}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.financeCount")}
                      </dt>
                      <dd className="text-lg font-semibold text-white">
                        {MOCK_ACCOUNT_ACTIVITY_SUMMARY[selectedAccount.account_id]?.finance_entries ?? 0}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("account.withdrawalCount")}
                      </dt>
                      <dd className="text-lg font-semibold text-white">
                        {MOCK_ACCOUNT_ACTIVITY_SUMMARY[selectedAccount.account_id]?.withdrawals ?? 0}
                      </dd>
                    </div>
                  </dl>
                </DataPanel>
              </div>
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {t("common.labels.handoff")}
              </p>
              <Link href={`/admin/users/${selectedAccount.user_id}`}>
                <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
              </Link>
              <Link href={`/admin/commission?account_id=${encodeURIComponent(selectedAccount.account_id)}`}>
                <AdminButton variant="secondary">{t("common.actions.viewCommission")}</AdminButton>
              </Link>
              <Link href={`/admin/finance/ledger?account_id=${encodeURIComponent(selectedAccount.account_id)}`}>
                <AdminButton variant="primary">{t("common.actions.viewFinance")}</AdminButton>
              </Link>
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}
