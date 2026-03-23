"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { FilterBar } from "@/components/system/data/filter-bar";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import type { AccountNetworkDetail, AccountNetworkRow, NetworkHistoryItem } from "@/types/network";

const NETWORK_TABS = ["overview", "relationship", "history"] as const;
type NetworkTab = (typeof NETWORK_TABS)[number];

function getStatusClass(status: AccountNetworkRow["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  return "bg-zinc-500/10 text-zinc-300";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatDepthLabel(value: AccountNetworkRow["relationshipDepth"]) {
  switch (value) {
    case "trader_only":
      return "Trader Only";
    case "has_l1":
      return "Has L1";
    case "has_l2":
      return "Has L2";
    default:
      return value;
  }
}

function getHistoryLabel(changeType: NetworkHistoryItem["changeType"]) {
  switch (changeType) {
    case "assign":
      return "Initial Assignment";
    case "replace_l1":
      return "L1 Replaced";
    case "replace_l2":
      return "L2 Replaced";
    case "remove_l1":
      return "L1 Removed";
    case "remove_l2":
      return "L2 Removed";
    default:
      return changeType;
  }
}

const columns: DataTableColumn<AccountNetworkRow>[] = [
  {
    key: "account",
    header: "Account",
    cell: (row) => (
      <div className="space-y-1">
        <p className="font-mono text-sm text-white">{row.accountCode}</p>
        <p className="text-xs text-zinc-500">{row.brokerName}</p>
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
    key: "chain",
    header: "Chain",
    cell: (row) => (
      <div className="space-y-1">
        <p className="text-sm text-zinc-300">
          {row.traderName} -&gt; {row.l1Name ?? "-"} -&gt; {row.l2Name ?? "-"}
        </p>
        <p className="font-mono text-xs text-zinc-500">
          {row.traderUserId} / {row.l1UserId ?? "-"} / {row.l2UserId ?? "-"}
        </p>
      </div>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
          row.status
        )}`}
      >
        {row.status}
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
    key: "updatedAt",
    header: "Updated At",
    cell: (row) => formatDate(row.updatedAt),
    cellClassName: "py-3 pr-4 text-sm text-zinc-400",
  },
];

export function NetworkPageClient({
  rows,
  details,
}: {
  rows: AccountNetworkRow[];
  details: AccountNetworkDetail[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    inputFilters,
    appliedFilters,
    setInputFilter,
    applyFilters,
    clearFilters,
  } = useTableQueryState({
    filters: {
      keyword: "",
      broker: "all",
      status: "all",
      has_l1: "all",
      has_l2: "all",
      relationship_depth: "all",
    },
  });

  const currentSnapshots = useMemo(() => details.filter((detail) => detail.isCurrent), [details]);

  const currentDetailByAccountId = useMemo(
    () => new Map(currentSnapshots.map((detail) => [detail.accountId, detail])),
    [currentSnapshots]
  );

  const snapshotById = useMemo(
    () => new Map(details.map((detail) => [detail.id, detail])),
    [details]
  );

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesKeyword =
        !keyword ||
        row.accountId.toLowerCase().includes(keyword) ||
        row.accountCode.toLowerCase().includes(keyword) ||
        row.traderUserId.toLowerCase().includes(keyword) ||
        row.traderName.toLowerCase().includes(keyword) ||
        currentDetailByAccountId
          .get(row.accountId)
          ?.trader.email?.toLowerCase()
          .includes(keyword);
      const matchesBroker =
        appliedFilters.broker === "all" || row.brokerName === appliedFilters.broker;
      const matchesStatus =
        appliedFilters.status === "all" || row.status === appliedFilters.status;
      const matchesL1 =
        appliedFilters.has_l1 === "all" ||
        (appliedFilters.has_l1 === "yes" ? Boolean(row.l1UserId) : !row.l1UserId);
      const matchesL2 =
        appliedFilters.has_l2 === "all" ||
        (appliedFilters.has_l2 === "yes" ? Boolean(row.l2UserId) : !row.l2UserId);
      const matchesRelationshipDepth =
        appliedFilters.relationship_depth === "all" ||
        (appliedFilters.relationship_depth === "trader_only"
          ? !row.l1UserId && !row.l2UserId
          : appliedFilters.relationship_depth === "has_l1"
            ? Boolean(row.l1UserId)
            : Boolean(row.l2UserId));

      return (
        matchesKeyword &&
        matchesBroker &&
        matchesStatus &&
        matchesL1 &&
        matchesL2 &&
        matchesRelationshipDepth
      );
    });
  }, [appliedFilters, currentDetailByAccountId, rows]);

  const snapshotIdFromUrl = searchParams.get("snapshot_id") ?? "";
  const detailAccountIdFromUrl = searchParams.get("detail_account_id") ?? "";
  const tabFromUrl = searchParams.get("tab") ?? "overview";

  const {
    selectedItem,
    isOpen,
    activeTab,
    changeTab,
  } = useDrawerQueryState<AccountNetworkDetail, NetworkTab>({
    detailKey: "detail_account_id",
    tabKey: "tab",
    defaultTab: "overview",
    validTabs: NETWORK_TABS,
    items: currentSnapshots,
    getItemId: (item) => item.accountId,
  });

  const selectedDetail = snapshotIdFromUrl
    ? (snapshotById.get(snapshotIdFromUrl) ?? null)
    : selectedItem;

  const drawerOpen = snapshotIdFromUrl ? Boolean(selectedDetail) : isOpen;
  const resolvedActiveTab = NETWORK_TABS.includes(tabFromUrl as NetworkTab)
    ? (tabFromUrl as NetworkTab)
    : activeTab;

  const brokerOptions = useMemo(
    () => [
      { value: "all", label: "All brokers" },
      ...Array.from(new Set(rows.map((row) => row.brokerName))).map((broker) => ({
        value: broker,
        label: broker,
      })),
    ],
    [rows]
  );

  function openFromRow(row: AccountNetworkRow) {
    const detail = currentDetailByAccountId.get(row.accountId);
    if (detail) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("detail_account_id", detail.accountId);
      params.set("snapshot_id", detail.id);
      params.set("tab", "overview");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }

  function closeNetworkDrawer() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("detail_account_id");
    params.delete("snapshot_id");
    params.delete("tab");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl);
  }

  function changeNetworkTab(tab: NetworkTab) {
    changeTab(tab);
  }

  useEffect(() => {
    if (!snapshotIdFromUrl || detailAccountIdFromUrl) {
      return;
    }

    const matchedSnapshot = snapshotById.get(snapshotIdFromUrl);
    if (!matchedSnapshot) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("detail_account_id", matchedSnapshot.accountId);
    if (!params.get("tab")) {
      params.set("tab", "overview");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [detailAccountIdFromUrl, pathname, router, searchParams, snapshotById, snapshotIdFromUrl]);

  return (
    <div className="space-y-4">
      <FilterBar
        onApply={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        onReset={clearFilters}
        search={
          <div>
            <label
              htmlFor="keyword"
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
            >
              Search
            </label>
            <input
              id="keyword"
              name="keyword"
              value={inputFilters.keyword}
              onChange={(event) => setInputFilter("keyword", event.target.value)}
              placeholder="Search account, trader, or trader email"
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>
        }
        filters={
          <>
            <div className="sm:w-[180px]">
              <label
                htmlFor="broker"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
              >
                Broker
              </label>
              <AdminSelect
                value={inputFilters.broker}
                onValueChange={(value) => setInputFilter("broker", value)}
                options={brokerOptions}
              />
            </div>
            <div className="sm:w-[160px]">
              <label
                htmlFor="status"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
              >
                Status
              </label>
              <AdminSelect
                value={inputFilters.status}
                onValueChange={(value) => setInputFilter("status", value)}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "pending", label: "Pending" },
                ]}
              />
            </div>
            <div className="sm:w-[140px]">
              <label
                htmlFor="has_l1"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
              >
                Has L1
              </label>
              <AdminSelect
                value={inputFilters.has_l1}
                onValueChange={(value) => setInputFilter("has_l1", value)}
                options={[
                  { value: "all", label: "All" },
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
            </div>
            <div className="sm:w-[140px]">
              <label
                htmlFor="relationship_depth"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
              >
                Relationship Depth
              </label>
              <AdminSelect
                value={inputFilters.relationship_depth}
                onValueChange={(value) => setInputFilter("relationship_depth", value)}
                options={[
                  { value: "all", label: "All" },
                  { value: "trader_only", label: "Trader Only" },
                  { value: "has_l1", label: "Has L1" },
                  { value: "has_l2", label: "Has L2" },
                ]}
              />
            </div>
            <div className="sm:w-[140px]">
              <label
                htmlFor="has_l2"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
              >
                Has L2
              </label>
              <AdminSelect
                value={inputFilters.has_l2}
                onValueChange={(value) => setInputFilter("has_l2", value)}
                options={[
                  { value: "all", label: "All" },
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
            </div>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={filteredRows}
        getRowKey={(row) => row.id}
        minWidthClassName="min-w-[1180px]"
        emptyMessage="No account-level relationships match the current search and filters."
        onRowClick={openFromRow}
        rowClassName="text-zinc-200 even:bg-white/[0.02] hover:bg-white/[0.04]"
      />

      <AppDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) closeNetworkDrawer();
        }}
        title={selectedDetail?.accountCode ?? "Network Detail"}
        width="wide"
      >
        {selectedDetail ? (
          <>
            <DrawerHeader
              title={selectedDetail.accountCode}
              description={`${selectedDetail.brokerName} | account relationship snapshot`}
              onClose={closeNetworkDrawer}
            />
            <DrawerDivider />
            <DrawerTabs
              tabs={NETWORK_TABS}
              activeTab={resolvedActiveTab}
              onChange={changeNetworkTab}
              getLabel={(tab) =>
                tab === "overview"
                  ? "Overview"
                  : tab === "relationship"
                    ? "Relationship"
                    : "History"
              }
            />
            <DrawerDivider />
            <DrawerBody>
              {resolvedActiveTab === "overview" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Overview
                      </h3>
                    }
                  >
                    <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Snapshot ID
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedDetail.id}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Snapshot Code
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedDetail.snapshotCode}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Account ID
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedDetail.accountId}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Account Code
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedDetail.accountCode}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Broker
                        </dt>
                        <dd className="text-sm text-white">{selectedDetail.brokerName}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Snapshot Status
                        </dt>
                        <dd>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                                selectedDetail.status
                              )}`}
                            >
                              {selectedDetail.status}
                            </span>
                            <span className="inline-flex rounded-full bg-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300">
                              {selectedDetail.isCurrent ? "Current Snapshot" : "Historical Snapshot"}
                            </span>
                          </div>
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Effective From
                        </dt>
                        <dd className="text-sm text-zinc-300">{formatDate(selectedDetail.effectiveFrom)}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Effective To
                        </dt>
                        <dd className="text-sm text-zinc-300">
                          {selectedDetail.effectiveTo ? formatDate(selectedDetail.effectiveTo) : "Current"}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Relationship Depth
                        </dt>
                        <dd className="text-sm text-zinc-300">
                          {formatDepthLabel(selectedDetail.relationshipDepth)}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Updated At
                        </dt>
                        <dd className="text-sm text-zinc-300">
                          {formatDate(selectedDetail.updatedAt)}
                        </dd>
                      </div>
                    </dl>
                  </DataPanel>

                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Context / Relationship
                      </h3>
                    }
                  >
                    <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Trader
                        </dt>
                        <dd className="text-sm font-medium text-white">{selectedDetail.trader.name}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Trader User ID
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedDetail.trader.userId}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Trader Email
                        </dt>
                        <dd className="text-sm text-zinc-300">{selectedDetail.trader.email ?? "—"}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          L1
                        </dt>
                        <dd className="space-y-1 text-sm text-zinc-300">
                          <span className="block">{selectedDetail.l1?.name ?? "—"}</span>
                          {selectedDetail.l1 ? (
                            <Link
                              href={`/admin/network/ib?ib_user_id=${encodeURIComponent(selectedDetail.l1.userId)}`}
                              className="text-xs text-zinc-400 transition hover:text-white"
                            >
                              View Coverage
                            </Link>
                          ) : null}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          L2
                        </dt>
                        <dd className="space-y-1 text-sm text-zinc-300">
                          <span className="block">{selectedDetail.l2?.name ?? "—"}</span>
                          {selectedDetail.l2 ? (
                            <Link
                              href={`/admin/network/ib?ib_user_id=${encodeURIComponent(selectedDetail.l2.userId)}`}
                              className="text-xs text-zinc-400 transition hover:text-white"
                            >
                              View Coverage
                            </Link>
                          ) : null}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Relationship Scope
                        </dt>
                        <dd className="text-sm text-zinc-300">Account-level snapshot</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Source
                        </dt>
                        <dd className="text-sm text-zinc-300">{selectedDetail.source}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Created By
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedDetail.createdBy ?? "—"}
                        </dd>
                      </div>
                    </dl>
                  </DataPanel>
                </div>
              ) : resolvedActiveTab === "relationship" ? (
                <div className="grid gap-6">
                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Overview
                      </h3>
                    }
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Trader
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">{selectedDetail.trader.name}</p>
                        <p className="mt-1 font-mono text-xs text-zinc-500">{selectedDetail.trader.userId}</p>
                      </div>
                      <div className="text-center text-zinc-500">-&gt;</div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          L1
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {selectedDetail.l1?.name ?? "—"}
                        </p>
                        <p className="mt-1 font-mono text-xs text-zinc-500">
                          {selectedDetail.l1?.userId ?? "-"}
                        </p>
                        {selectedDetail.l1 ? (
                          <Link
                            href={`/admin/network/ib?ib_user_id=${encodeURIComponent(selectedDetail.l1.userId)}`}
                            className="mt-2 inline-block text-xs text-zinc-400 transition hover:text-white"
                          >
                            View Coverage
                          </Link>
                        ) : null}
                      </div>
                      <div className="text-center text-zinc-500">-&gt;</div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          L2
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {selectedDetail.l2?.name ?? "—"}
                        </p>
                        <p className="mt-1 font-mono text-xs text-zinc-500">
                          {selectedDetail.l2?.userId ?? "-"}
                        </p>
                        {selectedDetail.l2 ? (
                          <Link
                            href={`/admin/network/ib?ib_user_id=${encodeURIComponent(selectedDetail.l2.userId)}`}
                            className="mt-2 inline-block text-xs text-zinc-400 transition hover:text-white"
                          >
                            View Coverage
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </DataPanel>

                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Relationship Roles
                      </h3>
                    }
                  >
                    <div className="grid gap-4 text-sm md:grid-cols-3">
                      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Trader
                        </p>
                        <p className="text-sm font-medium text-white">Primary account owner</p>
                        <p className="text-sm text-zinc-400">Source of trading activity</p>
                      </div>
                      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          L1 (Level 1 IB)
                        </p>
                        <p className="text-sm font-medium text-white">
                          Direct rebate recipient from trader activity
                        </p>
                      </div>
                      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          L2 (Level 2 IB)
                        </p>
                        <p className="text-sm font-medium text-white">Override layer above L1</p>
                        <p className="text-sm text-zinc-400">
                          Receives upstream commission share
                        </p>
                      </div>
                    </div>
                  </DataPanel>
                </div>
              ) : (
                <div className="grid gap-6">
                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Snapshot Model
                      </h3>
                    }
                  >
                    <p className="text-sm text-zinc-400">
                      Each record represents a relationship snapshot version applied from its
                      effective date. Updates affect only future commission records. Historical
                      records remain unchanged.
                    </p>
                    <p className="mt-3 text-sm text-zinc-400">
                      Relationship updates apply only to future commission records. Historical
                      records remain unchanged.
                    </p>
                  </DataPanel>

                  <div className="space-y-4">
                    {[...selectedDetail.history]
                      .sort(
                        (left, right) =>
                          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
                      )
                      .map((item) => (
                        <DataPanel
                          key={item.id}
                          title={
                            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                              {getHistoryLabel(item.changeType)}
                            </h3>
                          }
                        >
                          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
                            <div className="space-y-2">
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Old Values
                              </dt>
                              <dd className="text-sm text-zinc-300">
                                Trader: {item.oldTraderName ?? "-"}
                                <br />
                                L1: {item.oldL1Name ?? "-"}
                                <br />
                                L2: {item.oldL2Name ?? "-"}
                              </dd>
                            </div>
                            <div className="space-y-2">
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                New Values
                              </dt>
                              <dd className="text-sm text-zinc-300">
                                Trader: {item.newTraderName ?? "-"}
                                <br />
                                L1: {item.newL1Name ?? "-"}
                                <br />
                                L2: {item.newL2Name ?? "-"}
                              </dd>
                            </div>
                            <div className="space-y-2">
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Effective From
                              </dt>
                              <dd className="text-sm text-zinc-300">{formatDate(item.effectiveFrom)}</dd>
                            </div>
                            <div className="space-y-2">
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Created At
                              </dt>
                              <dd className="text-sm text-zinc-300">{formatDate(item.createdAt)}</dd>
                            </div>
                            <div className="space-y-2">
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Changed By
                              </dt>
                              <dd className="font-mono text-sm text-zinc-300">{item.changedBy ?? "-"}</dd>
                            </div>
                            <div className="space-y-2">
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Note
                              </dt>
                              <dd className="text-sm text-zinc-300">{item.note ?? "-"}</dd>
                            </div>
                          </dl>
                        </DataPanel>
                      ))}
                  </div>
                </div>
              )}
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Handoff
              </p>
              <Link href={`/admin/users/${selectedDetail.trader.userId}`}>
                <AdminButton variant="ghost">View User</AdminButton>
              </Link>
              <Link href={`/admin/accounts/${selectedDetail.accountId}`}>
                <AdminButton variant="secondary">View Account</AdminButton>
              </Link>
              <Link href={`/admin/commission?account_id=${encodeURIComponent(selectedDetail.accountId)}`}>
                <AdminButton variant="ghost">View Commission</AdminButton>
              </Link>
              <Link href={`/admin/finance/ledger?account_id=${encodeURIComponent(selectedDetail.accountId)}`}>
                <AdminButton variant="primary">View Finance</AdminButton>
              </Link>
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}
