"use client";

import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable } from "@/components/system/data/data-table";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import {
  NETWORK_DEFAULT_FILTERS,
  NETWORK_DRAWER_QUERY_CONFIG,
  NETWORK_DRAWER_TABS,
} from "./_constants";
import { buildNetworkWorkspace, filterNetworkNodeRows } from "./_mappers";
import {
  getNetworkDrawerTabLabel,
  getNetworkNodeColumns,
  getNodeStatusClass,
  roleSummary,
} from "./_shared";
import { NetworkFilterBar } from "./network-filter-bar";
import type {
  NetworkDrawerTab,
  NetworkNodeDetail,
  NetworkFilters,
  NetworkSnapshotRecord,
} from "./_types";

export function NetworkPageClient({ snapshots }: { snapshots: NetworkSnapshotRecord[] }) {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const workspace = useMemo(() => buildNetworkWorkspace(snapshots), [snapshots]);
  const detailMap = useMemo(
    () => new Map(workspace.details.map((detail) => [detail.nodeId, detail])),
    [workspace.details]
  );

  const filters = useAdminFilters<NetworkFilters>({
    defaultFilters: NETWORK_DEFAULT_FILTERS,
  });

  const drawerState = useDrawerQueryState<NetworkNodeDetail, NetworkDrawerTab>({
    detailKey: NETWORK_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: NETWORK_DRAWER_QUERY_CONFIG.tabKey,
    defaultTab: "overview",
    validTabs: NETWORK_DRAWER_TABS,
    items: workspace.details,
    getItemId: (item) => item.nodeId,
  });

  const filteredRows = useMemo(
    () => filterNetworkNodeRows(workspace.rows, filters.appliedFilters),
    [workspace.rows, filters.appliedFilters]
  );

  const ibUserIdFromUrl = searchParams.get("ib_user_id") ?? "";

  useEffect(() => {
    if (!ibUserIdFromUrl || searchParams.get(NETWORK_DRAWER_QUERY_CONFIG.detailKey)) {
      return;
    }

    const matchedDetail = detailMap.get(ibUserIdFromUrl);
    if (!matchedDetail) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ib_user_id");
    params.delete("parent_ib_user_id");
    params.set(NETWORK_DRAWER_QUERY_CONFIG.detailKey, matchedDetail.nodeId);
    params.set(NETWORK_DRAWER_QUERY_CONFIG.tabKey, "overview");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [detailMap, ibUserIdFromUrl, pathname, router, searchParams]);

  function openNode(rowId: string) {
    const detail = detailMap.get(rowId);
    if (!detail) {
      return;
    }

    drawerState.openDrawer(detail);
  }

  function closeDrawer() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(NETWORK_DRAWER_QUERY_CONFIG.detailKey);
    params.delete(NETWORK_DRAWER_QUERY_CONFIG.tabKey);
    params.delete("ib_user_id");
    params.delete("parent_ib_user_id");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div className="admin-surface-soft rounded-2xl px-4 py-3 text-sm text-zinc-400">
        Network is relationship-centric. Use it to understand where a node sits in the structure,
        how many people sit beneath them, and whether the node shows live business activity.
      </div>

      <div className="grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Nodes" value={workspace.summary.totalNodes} />
        <SummaryCard label="Active IBs" value={workspace.summary.activeIbs} />
        <SummaryCard label="Total Downlines" value={workspace.summary.totalDownlines} />
        <SummaryCard label="Active Traders" value={workspace.summary.activeTraders} />
      </div>

      <NetworkFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
      />

      <DataPanel
        title={<h3 className="text-xl font-semibold text-white">Network Nodes</h3>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            One row represents one user-like node. Relationship comes first, while account and
            commission signals stay lightweight and secondary.
          </p>
        }
      >
        <DataTable
          columns={getNetworkNodeColumns()}
          rows={filteredRows}
          getRowKey={(row) => row.nodeId}
          getRowAriaLabel={(row) => `Open network node ${row.displayName}`}
          minWidthClassName="min-w-[1120px]"
          emptyMessage="No network nodes match the current search and filters."
          onRowClick={(row) => openNode(row.nodeId)}
          rowClassName="text-zinc-200 even:bg-white/[0.02] hover:bg-white/[0.04]"
        />
      </DataPanel>

      <AppDrawer
        open={drawerState.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer();
          }
        }}
        title={drawerState.selectedItem?.displayName ?? "Network Node"}
        width="wide"
      >
        {drawerState.selectedItem ? (
          <>
            <DrawerHeader
              title={drawerState.selectedItem.displayName}
              description={`${drawerState.selectedItem.nodeId} | ${roleSummary(drawerState.selectedItem)}`}
              onClose={closeDrawer}
            />
            <DrawerDivider />
            <DrawerTabs
              tabs={NETWORK_DRAWER_TABS}
              activeTab={drawerState.activeTab}
              onChange={drawerState.changeTab}
              getLabel={getNetworkDrawerTabLabel}
            />
            <DrawerDivider />
            <DrawerBody>
              {drawerState.activeTab === "overview" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.overview")}
                      </h3>
                    }
                  >
                    <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <DetailItem label="Node ID" value={drawerState.selectedItem.nodeId} mono />
                      <DetailItem
                        label="Email"
                        value={drawerState.selectedItem.email ?? t("common.empty.dash")}
                      />
                      <DetailItem
                        label="Roles in Network"
                        value={roleSummary(drawerState.selectedItem)}
                      />
                      <DetailItem
                        label={t("common.labels.status")}
                        value={
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getNodeStatusClass(
                              drawerState.selectedItem.status
                            )}`}
                          >
                            {drawerState.selectedItem.status}
                          </span>
                        }
                      />
                      <DetailItem
                        label="First Seen"
                        value={formatDate(drawerState.selectedItem.firstSeenAt)}
                      />
                      <DetailItem
                        label={t("common.labels.effectiveFrom")}
                        value={formatDate(drawerState.selectedItem.latestEffectiveFrom)}
                      />
                    </dl>
                  </DataPanel>

                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.contextRelationship")}
                      </h3>
                    }
                  >
                    <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <DetailItem
                        label="Current Uplinks"
                        value={String(drawerState.selectedItem.uplinks.length)}
                      />
                      <DetailItem
                        label="Direct Referrals"
                        value={String(drawerState.selectedItem.directReferrals)}
                      />
                      <DetailItem
                        label="Total Downline"
                        value={String(drawerState.selectedItem.totalDownline)}
                      />
                      <DetailItem
                        label="Sub-IB Count"
                        value={String(drawerState.selectedItem.subIbCount)}
                      />
                      <DetailItem
                        label="Structure"
                        value={drawerState.selectedItem.structureSummary}
                      />
                    </dl>
                  </DataPanel>
                </div>
              ) : drawerState.activeTab === "relationship" ? (
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Uplink
                      </h3>
                    }
                    description={
                      <p className="text-sm text-zinc-400">
                        Current parent context is still aggregated from account-level relationship
                        snapshots.
                      </p>
                    }
                  >
                    <ReferenceList
                      items={drawerState.selectedItem.uplinks}
                      emptyLabel="No current uplink"
                    />
                  </DataPanel>

                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Direct Referrals
                      </h3>
                    }
                    description={
                      <p className="text-sm text-zinc-400">
                        Direct child nodes under the current node in the current relationship view.
                      </p>
                    }
                  >
                    <ReferenceList
                      items={drawerState.selectedItem.directReferralNodes}
                      emptyLabel="No direct referrals"
                    />
                  </DataPanel>
                </div>
              ) : drawerState.activeTab === "signals" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Signals
                      </h3>
                    }
                  >
                    <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <DetailItem
                        label="Linked Accounts"
                        value={String(drawerState.selectedItem.linkedAccountsCount)}
                      />
                      <DetailItem
                        label="Active Linked Accounts"
                        value={String(drawerState.selectedItem.activeAccountCount)}
                      />
                      <DetailItem
                        label="Active Trader"
                        value={drawerState.selectedItem.activeTrader ? "Yes" : "No"}
                      />
                      <DetailItem
                        label="Commission Signal"
                        value={drawerState.selectedItem.commissionSignal}
                      />
                    </dl>
                  </DataPanel>

                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Linked Account References
                      </h3>
                    }
                    description={
                      <p className="text-sm text-zinc-400">
                        Keep account inspection inside Trading Accounts. This preview is only for
                        lightweight network context.
                      </p>
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      {drawerState.selectedItem.linkedAccounts.slice(0, 6).map((account) => (
                        <span
                          key={account.accountId}
                          className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1 text-xs text-zinc-300"
                        >
                          <span className="font-mono">{account.accountCode}</span>
                          <span className="text-zinc-500">{account.brokerName}</span>
                        </span>
                      ))}
                    </div>
                  </DataPanel>
                </div>
              ) : (
                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("common.labels.handoff")}
                    </h3>
                  }
                  description={
                    <p className="text-sm text-zinc-400">
                      Use Network to understand node position first, then move into the relevant
                      record-centric modules when needed.
                    </p>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ModuleLinkCard
                      href={drawerState.selectedItem.links.userHref}
                      title="Users"
                      description="Open identity and profile context."
                    />
                    <ModuleLinkCard
                      href={drawerState.selectedItem.links.accountsHref}
                      title="Trading Accounts"
                      description="Review linked account records and snapshots."
                    />
                    {drawerState.selectedItem.links.commissionHref ? (
                      <ModuleLinkCard
                        href={drawerState.selectedItem.links.commissionHref}
                        title="Commission"
                        description="Open linked commission records anchored to account context."
                      />
                    ) : null}
                    <ModuleLinkCard
                      href={drawerState.selectedItem.links.financeHref}
                      title="Finance"
                      description="Jump into finance records and downstream audit trails."
                    />
                  </div>
                </DataPanel>
              )}
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {t("common.labels.handoff")}
              </p>
              <ReturnContextLink href={drawerState.selectedItem.links.userHref}>
                <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
              </ReturnContextLink>
              <ReturnContextLink href={drawerState.selectedItem.links.accountsHref}>
                <AdminButton variant="secondary">{t("common.actions.viewAccount")}</AdminButton>
              </ReturnContextLink>
              {drawerState.selectedItem.links.commissionHref ? (
                <ReturnContextLink href={drawerState.selectedItem.links.commissionHref}>
                  <AdminButton variant="ghost">{t("common.actions.viewCommission")}</AdminButton>
                </ReturnContextLink>
              ) : null}
              <ReturnContextLink href={drawerState.selectedItem.links.financeHref}>
                <AdminButton variant="ghost">{t("common.actions.viewFinance")}</AdminButton>
              </ReturnContextLink>
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-surface-soft rounded-2xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "min-w-0 break-all font-mono text-sm text-zinc-300"
            : "min-w-0 break-words text-sm text-zinc-300"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ReferenceList({
  items,
  emptyLabel,
}: {
  items: NetworkNodeDetail["uplinks"];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div className="break-words text-sm text-zinc-500" role="status" aria-live="polite">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.nodeId} className="rounded-xl bg-white/[0.03] px-4 py-3">
          <p className="break-words text-sm font-medium text-white">{item.displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{item.nodeId}</span>
            <span>
              {item.primaryRole === "trader"
                ? "Trader"
                : item.primaryRole === "l1"
                  ? "L1 IB"
                  : "L2 IB"}
            </span>
            {item.email ? <span>{item.email}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ModuleLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <ReturnContextLink
      href={href}
      className="admin-surface-soft block rounded-2xl px-4 py-3 transition-colors hover:bg-white/[0.06]"
    >
      <p className="break-words text-sm font-medium text-white">{title}</p>
      <p className="mt-1 break-words text-xs text-zinc-500">{description}</p>
    </ReturnContextLink>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

