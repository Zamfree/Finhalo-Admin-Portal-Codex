"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminSelect } from "@/components/system/controls/admin-select";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { FilterBar } from "@/components/system/data/filter-bar";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import type {
  AccountNetworkDetail,
  IbDirectClientRow,
  IbDirectSubIbRow,
  IbNetworkSummary,
} from "@/types/network";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getStatusClass(status: AccountNetworkDetail["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  return "bg-zinc-500/10 text-zinc-300";
}

function getCoverageHref(userId: string, selectedIbId?: string) {
  const params = new URLSearchParams();
  params.set("ib_user_id", userId);

  if (selectedIbId) {
    params.set("parent_ib_user_id", selectedIbId);
  }

  return `/admin/network?${params.toString()}`;
}

const directClientColumns: DataTableColumn<IbDirectClientRow>[] = [
  {
    key: "account",
    header: "Account",
    cell: (row) => (
      <div className="space-y-1">
        <p className="font-mono text-sm text-white">{row.accountCode}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-mono text-zinc-500">{row.accountId}</span>
          <Link
            href={`/admin/accounts/${encodeURIComponent(row.accountId)}`}
            onClick={(event) => event.stopPropagation()}
            className="admin-link-action"
          >
            View Account
          </Link>
        </div>
      </div>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "trader",
    header: "Trader",
    cell: (row) => (
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{row.traderName}</p>
        <p className="font-mono text-xs text-zinc-500">{row.traderUserId}</p>
      </div>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "broker",
    header: "Broker",
    cell: (row) => row.brokerName,
    cellClassName: "py-3 pr-4 text-sm text-zinc-300",
  },
  {
    key: "snapshotStatus",
    header: "Snapshot Status",
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
          row.snapshotStatus
        )}`}
      >
        {row.snapshotStatus}
      </span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "effectiveFrom",
    header: "Effective From",
    cell: (row) => formatDate(row.effectiveFrom),
    cellClassName: "py-3 pr-4 text-sm text-zinc-400",
  },
  {
    key: "relationship_snapshot_id",
    header: "Relationship Snapshot ID",
    cell: (row) => (
      <Link
        href={`/admin/network?detail_account_id=${encodeURIComponent(row.accountId)}&tab=overview&snapshot_id=${encodeURIComponent(row.relationship_snapshot_id)}`}
        onClick={(event) => event.stopPropagation()}
        className="font-mono text-sm text-zinc-300 transition hover:text-white"
      >
        {row.relationship_snapshot_id}
      </Link>
    ),
    cellClassName: "py-3 pr-0",
  },
];

export function NetworkIbPageClient({
  snapshots,
}: {
  snapshots: AccountNetworkDetail[];
  initialIbUserId?: string;
}) {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parentIbId = searchParams.get("parent_ib_user_id") ?? "";

  const ibOptions = useMemo(() => {
    const ibMap = new Map<string, string>();

    for (const snapshot of snapshots) {
      if (snapshot.l1) {
        ibMap.set(snapshot.l1.userId, snapshot.l1.name);
      }
      if (snapshot.l2) {
        ibMap.set(snapshot.l2.userId, snapshot.l2.name);
      }
    }

    return Array.from(ibMap.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, name]) => ({ value, name }));
  }, [snapshots]);

  const {
    inputFilters,
    appliedFilters,
    setInputFilter,
    applyFilters,
    clearFilters,
  } = useTableQueryState({
    filters: {
      keyword: "",
      ib_user_id: "all",
    },
  });

  const filteredIbOptions = useMemo(() => {
    const keyword = inputFilters.keyword.trim().toLowerCase();

    if (!keyword) {
      return ibOptions;
    }

    return ibOptions.filter(
      (option) =>
        option.value.toLowerCase().includes(keyword) || option.name.toLowerCase().includes(keyword)
    );
  }, [ibOptions, inputFilters.keyword]);

  const appliedIbOptions = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    if (!keyword) {
      return ibOptions;
    }

    return ibOptions.filter(
      (option) =>
        option.value.toLowerCase().includes(keyword) || option.name.toLowerCase().includes(keyword)
    );
  }, [appliedFilters.keyword, ibOptions]);

  const selectedIbId =
    appliedFilters.ib_user_id !== "all"
      ? appliedFilters.ib_user_id
      : appliedIbOptions[0]?.value ?? ibOptions[0]?.value ?? "";

  const selectedIbName =
    ibOptions.find((option) => option.value === selectedIbId)?.name ?? t("network.unknownIb");
  const parentIbName = parentIbId
    ? ibOptions.find((option) => option.value === parentIbId)?.name ?? t("network.unknownIb")
    : "";

  function updateIbSelection(nextIbUserId: string, parentIbUserId?: string) {
    setInputFilter("ib_user_id", nextIbUserId);

    const params = new URLSearchParams(searchParams.toString());
    if (nextIbUserId === "all") {
      params.delete("ib_user_id");
      params.delete("parent_ib_user_id");
    } else {
      params.set("ib_user_id", nextIbUserId);
      if (parentIbUserId) {
        params.set("parent_ib_user_id", parentIbUserId);
      } else {
        params.delete("parent_ib_user_id");
      }
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl);
  }

  function handleResetFilters() {
    clearFilters();
    router.replace(pathname);
  }

  const directSubIbColumns = useMemo<DataTableColumn<IbDirectSubIbRow>[]>(
    () => [
      {
        key: "subIb",
        header: "Sub IB",
        cell: (row) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{row.subIbName}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-mono text-zinc-500">{row.subIbUserId}</span>
              <Link
                href={getCoverageHref(row.subIbUserId, selectedIbId || undefined)}
                onClick={(event) => event.stopPropagation()}
                className="admin-link-action"
              >
                {t("common.actions.viewCoverage")}
              </Link>
            </div>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "coveredAccounts",
        header: "Covered Accounts",
        cell: (row) => row.coveredAccounts,
        cellClassName: "py-3 pr-4 text-sm tabular-nums text-white",
      },
      {
        key: "activeAccounts",
        header: "Active Accounts",
        cell: (row) => row.activeAccounts,
        cellClassName: "py-3 pr-4 text-sm tabular-nums text-zinc-300",
      },
      {
        key: "latestEffectiveFrom",
        header: "Latest Effective From",
        cell: (row) => formatDate(row.latestEffectiveFrom),
        cellClassName: "py-3 pr-0 text-sm text-zinc-400",
      },
    ],
    [selectedIbId, t]
  );

  const directClientRows = useMemo<IbDirectClientRow[]>(() => {
    if (!selectedIbId) {
      return [];
    }

    return snapshots
      .filter((snapshot) => snapshot.l1?.userId === selectedIbId)
      .map((snapshot) => ({
        accountId: snapshot.accountId,
        accountCode: snapshot.accountCode,
        traderUserId: snapshot.trader.userId,
        traderName: snapshot.trader.name,
        brokerName: snapshot.brokerName,
        snapshotStatus: snapshot.status,
        effectiveFrom: snapshot.effectiveFrom,
        relationship_snapshot_id: snapshot.id,
      }));
  }, [selectedIbId, snapshots]);

  const directSubIbRows = useMemo<IbDirectSubIbRow[]>(() => {
    if (!selectedIbId) {
      return [];
    }

    const subIbCoverage = new Map<
      string,
      { subIbName: string; coveredAccounts: number; activeAccounts: number; latestEffectiveFrom: string }
    >();

    for (const snapshot of snapshots.filter((item) => item.l2?.userId === selectedIbId)) {
      if (!snapshot.l1?.userId) continue;

      const subIbId = snapshot.l1.userId;
      const existing = subIbCoverage.get(subIbId);

      if (existing) {
        const existing = subIbCoverage.get(subIbId);

        if (existing) {
          existing.coveredAccounts += 1;
          if (snapshot.status === "active") {
            existing.activeAccounts += 1;
          }
          if (new Date(snapshot.effectiveFrom).getTime() > new Date(existing.latestEffectiveFrom).getTime()) {
            existing.latestEffectiveFrom = snapshot.effectiveFrom;
          }
        } else {
          subIbCoverage.set(subIbId, {
            subIbName: snapshot.l1.name,
            coveredAccounts: 1,
            activeAccounts: snapshot.status === "active" ? 1 : 0,
            latestEffectiveFrom: snapshot.effectiveFrom,
          });
        }
      }
    }
    return Array.from(subIbCoverage.entries())
      .map(([subIbUserId, value]) => ({
        subIbUserId,
        subIbName: value.subIbName,
        coveredAccounts: value.coveredAccounts,
        activeAccounts: value.activeAccounts,
        latestEffectiveFrom: value.latestEffectiveFrom,
      }))
      .sort((left, right) => left.subIbName.localeCompare(right.subIbName));
  }, [selectedIbId, snapshots]);

  const upstreamL2Context = useMemo(() => {
    if (!selectedIbId) {
      return [];
    }

    const l2Map = new Map<string, { name: string; coveredAccounts: number }>();

    for (const snapshot of snapshots.filter((item) => item.l1?.userId === selectedIbId && item.l2)) {
      
      if (!snapshot.l2?.userId) continue;

      const l2UserId = snapshot.l2.userId;
      const existing = l2Map.get(l2UserId);

      if (existing) {
        existing.coveredAccounts += 1;
      } else {
        l2Map.set(l2UserId, {
          name: snapshot.l2.name,
          coveredAccounts: 1,
        });
      }
    }

    return Array.from(l2Map.entries())
      .map(([userId, value]) => ({
        userId,
        name: value.name,
        coveredAccounts: value.coveredAccounts,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [selectedIbId, snapshots]);

  const summary = useMemo<IbNetworkSummary | null>(() => {
    if (!selectedIbId) {
      return null;
    }

    const coveredSnapshots = snapshots.filter(
      (snapshot) => snapshot.l1?.userId === selectedIbId || snapshot.l2?.userId === selectedIbId
    );

    return {
      ibUserId: selectedIbId,
      ibName: selectedIbName,
      directClientAccounts: directClientRows.length,
      directSubIbs: directSubIbRows.length,
      totalCoveredAccounts: coveredSnapshots.length,
      activeCoveredAccounts: coveredSnapshots.filter((snapshot) => snapshot.status === "active").length,
    };
  }, [directClientRows.length, directSubIbRows.length, selectedIbId, selectedIbName, snapshots]);

  return (
    <div className="space-y-6">
      <div className="admin-surface-soft rounded-2xl px-4 py-3 text-sm text-zinc-400">
        {t("network.helper")}
      </div>

      <FilterBar
        onApply={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        onReset={handleResetFilters}
        search={
          <div>
            <label
              htmlFor="network_ib_keyword"
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
            >
              {t("network.searchIb")}
            </label>
            <input
              id="network_ib_keyword"
              name="network_ib_keyword"
              value={inputFilters.keyword}
              onChange={(event) => setInputFilter("keyword", event.target.value)}
              placeholder={t("network.searchPlaceholder")}
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>
        }
        filters={
          <div className="sm:w-[260px]">
            <label
              htmlFor="ib_user_id"
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
            >
              {t("network.ibSelection")}
            </label>
            <AdminSelect
              value={inputFilters.ib_user_id}
              onValueChange={updateIbSelection}
              options={[
                {
                  value: "all",
                  label: filteredIbOptions[0]
                    ? `Auto: ${filteredIbOptions[0].name}`
                    : t("network.noIbSelected"),
                },
                ...filteredIbOptions.map((option) => ({
                  value: option.value,
                  label: `${option.name} (${option.value})`,
                })),
              ]}
            />
          </div>
        }
      />

      {summary ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {t("network.currentIb")}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{summary.ibName}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">{summary.ibUserId}</p>
                </div>
                {parentIbId ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("network.previousIb")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-zinc-300">{parentIbName}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{parentIbId}</p>
                  </div>
                ) : null}
              </div>

              {parentIbId ? (
                <button
                  type="button"
                  onClick={() => updateIbSelection(parentIbId)}
                  className="admin-link-action text-sm"
                >
                  {t("network.backToPreviousIb")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="admin-surface-soft rounded-2xl p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {t("network.directClientAccounts")}
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {summary.directClientAccounts}
              </p>
            </div>
            <div className="admin-surface-soft rounded-2xl p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {t("network.coveredL1Ibs")}
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {summary.directSubIbs}
              </p>
            </div>
            <div className="admin-surface-soft rounded-2xl p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {t("network.totalCoveredAccounts")}
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {summary.totalCoveredAccounts}
              </p>
            </div>
            <div className="admin-surface-soft rounded-2xl p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {t("network.activeCoveredAccounts")}
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {summary.activeCoveredAccounts}
              </p>
            </div>
          </div>

          <DataPanel
            title={<h3 className="text-xl font-semibold text-white">{t("network.upstreamL2Context")}</h3>}
            description={
              <p className="max-w-3xl text-sm text-zinc-400">{t("network.upstreamL2Description")}</p>
            }
          >
            {upstreamL2Context.length ? (
              <div className="space-y-3">
                {upstreamL2Context.map((item) => (
                  <div
                    key={item.userId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="font-mono text-xs text-zinc-500">{item.userId}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs text-zinc-400">
                        {t("network.coveredAccounts")}:{" "}
                        <span className="tabular-nums text-zinc-200">{item.coveredAccounts}</span>
                      </p>
                      <Link
                        href={getCoverageHref(item.userId, selectedIbId)}
                        className="admin-link-action text-xs"
                      >
                        {t("common.actions.viewCoverage")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
                {t("network.upstreamL2Empty")}
              </div>
            )}
          </DataPanel>

          <DataPanel
            title={<h3 className="text-xl font-semibold text-white">{t("network.directClientAccounts")}</h3>}
            description={
              <p className="max-w-3xl text-sm text-zinc-400">{t("network.directClientsDescription")}</p>
            }
          >
            <DataTable
              columns={directClientColumns}
              rows={directClientRows}
              getRowKey={(row) => row.relationship_snapshot_id}
              minWidthClassName="min-w-[1040px]"
              emptyMessage={t("network.noDirectClients")}
              onRowClick={(row) =>
                router.push(
                  `/admin/network?detail_account_id=${encodeURIComponent(
                    row.accountId
                  )}&tab=overview&snapshot_id=${encodeURIComponent(row.relationship_snapshot_id)}`
                )
              }
            />
          </DataPanel>

          <DataPanel
            title={<h3 className="text-xl font-semibold text-white">{t("network.l1UnderL2Title")}</h3>}
            description={
              <p className="max-w-3xl text-sm text-zinc-400">{t("network.l1UnderL2Description")}</p>
            }
          >
            <DataTable
              columns={directSubIbColumns}
              rows={directSubIbRows}
              getRowKey={(row) => row.subIbUserId}
              minWidthClassName="min-w-[760px]"
              emptyMessage={t("network.noCoveredL1s")}
              onRowClick={(row) => updateIbSelection(row.subIbUserId, selectedIbId || undefined)}
            />
          </DataPanel>
        </>
      ) : (
        <div className="admin-surface-soft flex min-h-32 items-center justify-center rounded-2xl p-6 text-sm text-zinc-500">
          {t("network.noCoverage")}
        </div>
      )}
    </div>
  );
}
