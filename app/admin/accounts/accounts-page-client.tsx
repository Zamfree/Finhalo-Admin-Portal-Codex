"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format } from "date-fns";

import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";

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

function renderPanelTitle(title: string) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
      {title}
    </h3>
  );
}

export type AccountsPageClientProps = {
  rows: TradingAccountRecord[];
};


export function AccountsPageClient({ rows }: AccountsPageClientProps) {
  const { t } = useAdminPreferences();

  const {
    inputFilters,
    appliedFilters,
    setInputFilter,
    applyFilters,
    clearFilters,
  } = useTableQueryState({
    filters: {
      query: "",
      broker: "all",
      status: "all",
    },
  });

  const {
    selectedItem: selectedAccount,
    isOpen,
    activeTab,
    openDrawer,
    closeDrawer,
    changeTab,
  } = useDrawerQueryState({
    items: rows,
    getItemId: (item) => item.account_id,
    defaultTab: "overview",
    validTabs: ["overview", "relationship", "activity"] as const,
  });

  const accountColumns = useMemo<DataTableColumn<TradingAccountRecord>[]>(
    () => [
      {
        key: "account_id",
        header: t("common.labels.accountId"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="font-mono text-sm text-white">{row.account_id}</p>
            <p className="text-xs text-zinc-500">
              {t("common.labels.createdAt")} {format(new Date(row.created_at), "yyyy-MM-dd")}
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
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
              {row.account_type}
            </p>
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
        header: t("email"),
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
          <div className="space-y-1 font-mono text-xs">
            <p className="text-zinc-300">
              <span className="text-zinc-500">L1:</span> {getRoleValue(row.l1_ib_id)}
            </p>
            <p className="text-zinc-400">
              <span className="text-zinc-500">L2:</span> {getRoleValue(row.l2_ib_id)}
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
    const normalizedQuery = appliedFilters.query.trim().toLowerCase();

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

      const matchesBroker =
        appliedFilters.broker === "all" || row.broker === appliedFilters.broker;

      const matchesStatus =
        appliedFilters.status === "all" || row.status === appliedFilters.status;

      return matchesQuery && matchesBroker && matchesStatus;
    });
  }, [appliedFilters, rows]);

  const selectedAccountHistory = useMemo(
    () => (selectedAccount ? sortRelationshipHistory(selectedAccount.relationship_history) : []),
    [selectedAccount]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_220px_220px]">
        <input
          value={inputFilters.query}
          onChange={(event) => setInputFilter("query", event.target.value)}
          placeholder={t("account.traderAccountSearchPlaceholder")}
          className="admin-control h-11 rounded-xl border border-white/10 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
        />

        <AdminSelect
          value={inputFilters.broker}
          onValueChange={(value) => setInputFilter("broker", value)}
          options={brokers.map((option) => ({
            value: option,
            label: option === "all" ? t("common.filters.allBrokers") : option,
          }))}
        />

        <AdminSelect
          value={inputFilters.status}
          onValueChange={(value) => setInputFilter("status", value)}
          options={[
            { value: "all", label: t("common.filters.allStatuses") },
            { value: "active", label: t("account.active") },
            { value: "monitoring", label: t("account.monitoring") },
            { value: "suspended", label: t("account.suspended") },
          ]}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <AdminButton variant="ghost" onClick={clearFilters}>
          {t("common.actions.clear")}
        </AdminButton>
        <AdminButton variant="primary" onClick={applyFilters}>
          Apply Filters
        </AdminButton>
      </div>

      <DataTable
        columns={accountColumns}
        rows={filteredRows}
        getRowKey={(row) => row.account_id}
        minWidthClassName="min-w-[1140px]"
        emptyMessage={t("account.noAccounts")}
        onRowClick={(row) => openDrawer(row)}
      />

      <AppDrawer
        open={isOpen && !!selectedAccount}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        title={selectedAccount?.account_id ?? t("account.title")}
        width="wide"
      >
        {selectedAccount ? (
          <>
            <DrawerHeader
              title={selectedAccount.account_id}
              description={`${selectedAccount.broker} | ${selectedAccount.account_type}`}
              onClose={closeDrawer}
            />

            <DrawerTabs
              tabs={["overview", "relationship", "activity"] as const}
              activeTab={activeTab}
              onChange={changeTab}
              getLabel={(tab) => {
                if (tab === "overview") return "Overview";
                if (tab === "relationship") return "Relationship";
                if (tab === "activity") return "Activity";
                return tab;
              }}
            />

            <DrawerDivider />

            <DrawerBody>
              {activeTab === "overview" && (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
                  <DataPanel
                    title={renderPanelTitle(t("common.labels.overview"))}
                    description={t("account.overviewDescription")}
                  >
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.accountId")}
                        </p>
                        <p className="mt-2 font-mono text-sm text-zinc-300">{selectedAccount.account_id}</p>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.broker")}
                        </p>
                        <p className="mt-2 text-sm text-white">{selectedAccount.broker}</p>                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("account.accountType")}
                        </p>
                        <p className="mt-2 text-sm uppercase text-zinc-300">{selectedAccount.account_type}</p>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.status")}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                              selectedAccount.status
                            )}`}
                          >
                            {selectedAccount.status}
                          </span>
                        </div>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("email")}
                        </p>
                        <p className="mt-2 text-sm text-white">{selectedAccount.user_email}</p>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("account.userId")}
                        </p>
                        <p className="mt-2 text-sm text-white">{selectedAccount.user_id}
                        </p>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("account.traderUserIdOnAccount")}
                        </p>
                        <p className="mt-2 font-mono text-sm text-zinc-300">{selectedAccount.trader_user_id}</p>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.createdAt")}
                        </p>
                        <p className="mt-2 text-sm text-zinc-300">
                          {format(new Date(selectedAccount.created_at), "yyyy-MM-dd HH:mm:ss")}
                        </p>
                      </div>
                    </div>
                  </DataPanel>

                  <DataPanel
                    title={renderPanelTitle(t("account.relationshipSnapshot"))}
                    description={t("account.relationshipSnapshotDescription")}
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
                              <p className="text-sm font-medium text-white">
                                {selectedAccount.user_email}
                              </p>
                              <p className="font-mono text-xs text-zinc-500">
                                {selectedAccount.trader_user_id}
                              </p>
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
                              <p className="font-mono text-sm text-zinc-300">
                                {getRoleValue(selectedAccount.l1_ib_id)}
                              </p>
                            </div>

                            {selectedAccount.l1_ib_id ? (
                              <Link
                                href={`/admin/network?ib_user_id=${encodeURIComponent(
                                  selectedAccount.l1_ib_id
                                )}`}
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
                              <p className="font-mono text-sm text-zinc-300">
                                {getRoleValue(selectedAccount.l2_ib_id)}
                              </p>
                            </div>

                            {selectedAccount.l2_ib_id ? (
                              <Link
                                href={`/admin/network?ib_user_id=${encodeURIComponent(
                                  selectedAccount.l2_ib_id
                                )}`}
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

                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {t("common.labels.snapshotId")}
                          </p>
                          <p className="font-mono text-sm text-zinc-300">
                            {selectedAccount.relationship_snapshot_id}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {t("common.labels.snapshotCode")}
                          </p>
                          <p className="font-mono text-sm text-zinc-300">
                            {selectedAccount.snapshot_code}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {t("common.labels.snapshotStatus")}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
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
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {t("common.labels.relationshipDepth")}
                          </p>
                          <p className="mt-2 text-sm text-zinc-300">
                            {selectedAccount.relationship_depth}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {t("common.labels.effectiveFrom")}
                          </p>
                          <p className="mt-2 text-sm text-zinc-300">
                            {format(
                              new Date(selectedAccount.relationship_effective_from),
                              "yyyy-MM-dd HH:mm:ss"
                            )}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {t("common.labels.effectiveTo")}
                          </p>
                          <p className="mt-2 text-sm text-zinc-300">
                            {selectedAccount.relationship_effective_to
                              ? format(
                                new Date(selectedAccount.relationship_effective_to),
                                "yyyy-MM-dd HH:mm:ss"
                              )
                              : t("common.labels.current")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DataPanel>
                </div>
              )}

              {activeTab === "relationship" && (
                <div className="space-y-6">
                  <DataPanel
                    title={renderPanelTitle(t("account.snapshotHistory"))}
                    description={t("account.snapshotHistoryDescription")}
                  >
                    <div className="space-y-4">
                      {selectedAccountHistory.map((snapshot) => (
                        <div
                          key={snapshot.relationship_snapshot_id}
                          className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 pl-6"
                        >
                          <div className="absolute left-3 top-4 bottom-4 w-px bg-white/10" />
                          <div
                            className={`absolute left-[10px] top-4 h-2 w-2 rounded-full ${snapshot.is_current ? "bg-emerald-400" : "bg-white/40"
                              }`}
                          />
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <p className="font-mono text-sm text-white">
                                {snapshot.relationship_snapshot_id}
                              </p>
                              <p className="font-mono text-xs text-zinc-500">
                                {snapshot.snapshot_code}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getSnapshotStatusClass(
                                  snapshot.snapshot_status
                                )}`}
                              >
                                {snapshot.snapshot_status}
                              </span>

                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${snapshot.is_current
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-white/[0.06] text-zinc-300"
                                  }`}
                              >
                                {snapshot.is_current
                                  ? t("common.labels.current")
                                  : t("common.labels.historical")}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                {t("account.relationshipRoles")}
                              </p>
                              <p className="leading-6 text-zinc-300">
                                {t("account.trader")}: {snapshot.trader_user_id} → {t("account.l1Ib")}
                                : {getRoleValue(snapshot.l1_ib_id)} → {t("account.l2Ib")}:{" "}
                                {getRoleValue(snapshot.l2_ib_id)}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                {t("common.labels.relationshipDepth")}
                              </p>
                              <p className="text-zinc-300">{snapshot.relationship_depth}</p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                {t("common.labels.effectiveFrom")}
                              </p>
                              <p className="text-zinc-300">
                                {format(new Date(snapshot.effective_from), "yyyy-MM-dd HH:mm:ss")}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                {t("common.labels.effectiveTo")}
                              </p>
                              <p className="text-zinc-300">
                                {snapshot.effective_to
                                  ? format(
                                    new Date(snapshot.effective_to),
                                    "yyyy-MM-dd HH:mm:ss"
                                  )
                                  : t("common.labels.current")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DataPanel>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-6">
                  <DataPanel
                    title={renderPanelTitle(t("account.relatedActivity"))}
                    description={t("account.relatedActivityDescription")}

                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("account.commissionCount")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {MOCK_ACCOUNT_ACTIVITY_SUMMARY[selectedAccount.account_id]
                            ?.commission_records ?? 0}
                        </p>
                        <div className="mt-4">
                          <Link
                            href={`/admin/commission?account_id=${encodeURIComponent(
                              selectedAccount.account_id
                            )}`}
                            className="admin-link-action inline-flex items-center gap-1 text-xs"
                          >
                            {t("common.actions.viewCommission")}
                          </Link>
                        </div>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("account.rebateCount")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {MOCK_ACCOUNT_ACTIVITY_SUMMARY[selectedAccount.account_id]
                            ?.rebate_records ?? 0}
                        </p>
                        <div className="mt-4">
                          <Link
                            href={`/admin/commission?account_id=${encodeURIComponent(
                              selectedAccount.account_id
                            )}`}
                            className="admin-link-action inline-flex items-center gap-1 text-xs"
                          >
                            {t("common.actions.viewRebate")}                          </Link>
                        </div>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("account.financeCount")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {MOCK_ACCOUNT_ACTIVITY_SUMMARY[selectedAccount.account_id]
                            ?.finance_entries ?? 0}
                        </p>
                        <div className="mt-4">
                          <Link
                            href={`/admin/finance/ledger?account_id=${encodeURIComponent(
                              selectedAccount.account_id
                            )}`}
                            className="admin-link-action inline-flex items-center gap-1 text-xs"
                          >
                            {t("common.actions.viewFinance")}
                          </Link>
                        </div>
                      </div>

                      <div className="admin-surface-soft rounded-xl p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("account.withdrawalCount")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {MOCK_ACCOUNT_ACTIVITY_SUMMARY[selectedAccount.account_id]?.withdrawals ??
                            0}
                        </p>
                        <div className="mt-4">
                          <Link
                            href={`/admin/finance/ledger?account_id=${encodeURIComponent(
                              selectedAccount.account_id
                            )}`}
                            className="admin-link-action inline-flex items-center gap-1 text-xs"
                          >
                            {t("common.actions.viewWithdrawals")}                          </Link>
                        </div>
                      </div>
                    </div>
                  </DataPanel>
                </div>
              )}
            </DrawerBody>

            <DrawerDivider />

            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {t("common.labels.handoff")}
              </p>

              <Link href={`/admin/users/${selectedAccount.user_id}`}>
                <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
              </Link>

              <Link
                href={`/admin/commission?account_id=${encodeURIComponent(
                  selectedAccount.account_id
                )}`}
              >
                <AdminButton variant="secondary">
                  {t("common.actions.viewCommission")}
                </AdminButton>
              </Link>

              <Link
                href={`/admin/finance/ledger?account_id=${encodeURIComponent(
                  selectedAccount.account_id
                )}`}
              >
                <AdminButton variant="primary">{t("common.actions.viewFinance")}</AdminButton>
              </Link>
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}