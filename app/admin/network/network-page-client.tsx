"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
import {
  generateNetworkNodeReferralAccessAction,
  type NetworkRebateMutationState,
  updateNetworkNodeRebateRateAction,
} from "./actions";
import { buildNetworkWorkspace, filterNetworkNodeRows } from "./_mappers";
import {
  getNetworkDrawerTabLabel,
  getNetworkIbStatsColumns,
  getNetworkRelationshipColumns,
  getNetworkNodeColumns,
  getNodeStatusClass,
  roleSummary,
} from "./_shared";
import { NetworkFilterBar } from "./network-filter-bar";
import type {
  NetworkDrawerTab,
  NetworkNodeDetail,
  NetworkFilters,
  NetworkNodeRebateContext,
  NetworkSnapshotRecord,
} from "./_types";

const INITIAL_REBATE_STATE: NetworkRebateMutationState = {};

export function NetworkPageClient({
  snapshots,
  nodeRebateContextEntries,
}: {
  snapshots: NetworkSnapshotRecord[];
  nodeRebateContextEntries: Array<[string, NetworkNodeRebateContext]>;
}) {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nodeRebateContextMap = useMemo(
    () => new Map(nodeRebateContextEntries),
    [nodeRebateContextEntries]
  );

  const workspace = useMemo(
    () => buildNetworkWorkspace(snapshots, nodeRebateContextMap),
    [snapshots, nodeRebateContextMap]
  );
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
  const [moduleTab, setModuleTab] = useState<"nodes" | "ib" | "relationships">(() => {
    const tab = searchParams.get("module_tab");

    if (tab === "ib" || tab === "relationships") {
      return tab;
    }

    return "nodes";
  });
  const [rebateState, rebateFormAction, isRebatePending] = useActionState(
    updateNetworkNodeRebateRateAction,
    INITIAL_REBATE_STATE
  );
  const [accessState, accessFormAction, isAccessPending] = useActionState(
    generateNetworkNodeReferralAccessAction,
    INITIAL_REBATE_STATE
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

  useEffect(() => {
    if (!rebateState.success && !accessState.success) {
      return;
    }

    router.refresh();
  }, [accessState.success, rebateState.success, router]);

  useEffect(() => {
    const tab = searchParams.get("module_tab");
    const nextTab: "nodes" | "ib" | "relationships" =
      tab === "ib" || tab === "relationships" ? tab : "nodes";
    setModuleTab((current) => (current === nextTab ? current : nextTab));
  }, [searchParams]);

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

  function switchModuleTab(tab: "nodes" | "ib" | "relationships") {
    setModuleTab(tab);
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "nodes") {
      params.delete("module_tab");
    } else {
      params.set("module_tab", tab);
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full grid-cols-1 gap-1 rounded-xl bg-white/[0.04] p-1 sm:grid-cols-3">
        <AdminButton
          variant={moduleTab === "nodes" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchModuleTab("nodes")}
        >
          Node Explorer
        </AdminButton>
        <AdminButton
          variant={moduleTab === "ib" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchModuleTab("ib")}
        >
          IB Stats
        </AdminButton>
        <AdminButton
          variant={moduleTab === "relationships" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchModuleTab("relationships")}
        >
          Account Snapshot
        </AdminButton>
      </div>

      {moduleTab === "nodes" ? (
        <>
          <NetworkFilterBar
            inputFilters={filters.inputFilters}
            setInputFilter={filters.setInputFilter}
            applyFilters={filters.applyFilters}
            clearFilters={filters.clearFilters}
          />

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
        </>
      ) : null}

      {moduleTab === "ib" ? (
        <DataPanel
          title={
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              IB Coverage Stats
            </h3>
          }
          description={
            <p className="text-sm text-zinc-400">
              IB statistics are derived from current account-level relationship snapshots.
            </p>
          }
        >
          <DataTable
            columns={getNetworkIbStatsColumns()}
            rows={workspace.ibStats}
            getRowKey={(row) => row.ibUserId}
            minWidthClassName="min-w-[720px]"
            emptyMessage="No active IB statistics available."
            rowClassName="text-zinc-200 even:bg-white/[0.02] hover:bg-white/[0.04]"
          />
        </DataPanel>
      ) : null}

      {moduleTab === "relationships" ? (
        <DataPanel
          title={
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Account Relationship Snapshot
            </h3>
          }
          description={
            <p className="text-sm text-zinc-400">
              View current Trader / L1 / L2 mapping per account and open the account record
              directly.
            </p>
          }
        >
          <DataTable
            columns={getNetworkRelationshipColumns()}
            rows={workspace.relationshipRows}
            getRowKey={(row) => row.snapshotId}
            minWidthClassName="min-w-[980px]"
            emptyMessage="No relationship snapshots available."
            rowClassName="text-zinc-200 even:bg-white/[0.02] hover:bg-white/[0.04]"
          />
        </DataPanel>
      ) : null}

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
              ) : drawerState.activeTab === "rebate" ? (
                <div className="space-y-4" key={drawerState.selectedItem.nodeId}>
                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Rebate Ratio
                      </h3>
                    }
                    description={
                      <p className="text-sm text-zinc-400">
                        Configure node-level rebate ratio from Network. Rule execution remains
                        server-side.
                      </p>
                    }
                  >
                    <form action={rebateFormAction} className="space-y-3">
                      <input type="hidden" name="node_id" value={drawerState.selectedItem.nodeId} />
                      <label className="block space-y-1.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Rebate Rate (%)
                        </span>
                        <input
                          type="number"
                          name="rebate_rate"
                          min={0}
                          max={100}
                          step={0.0001}
                          defaultValue={drawerState.selectedItem.rebateRate ?? ""}
                          placeholder="e.g. 22.5"
                          className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                        />
                      </label>
                      <div className="flex items-center justify-end">
                        <AdminButton type="submit" variant="primary" disabled={isRebatePending}>
                          {isRebatePending ? "Saving..." : "Save Rebate Ratio"}
                        </AdminButton>
                      </div>
                    </form>
                  </DataPanel>

                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Referral Access
                      </h3>
                    }
                  >
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Current Code
                        </p>
                        <p className="mt-1 font-mono text-zinc-300">
                          {accessState.generatedCode ??
                            drawerState.selectedItem.referralCode ??
                            "Not generated"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Current Link
                        </p>
                        <p className="mt-1 break-all text-zinc-300">
                          {accessState.generatedLink ??
                            drawerState.selectedItem.referralLink ??
                            "Not generated"}
                        </p>
                      </div>
                    </div>
                    <form action={accessFormAction} className="mt-4 space-y-3">
                      <input type="hidden" name="node_id" value={drawerState.selectedItem.nodeId} />
                      <label className="block space-y-1.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Base URL (Optional)
                        </span>
                        <input
                          type="url"
                          name="base_url"
                          defaultValue={drawerState.selectedItem.referralLink?.split("?")[0] ?? ""}
                          placeholder="https://portal.finhalo.com/register"
                          className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                        />
                      </label>
                      <div className="flex items-center justify-end">
                        <AdminButton type="submit" variant="secondary" disabled={isAccessPending}>
                          {isAccessPending ? "Generating..." : "Generate Referral Link + Code"}
                        </AdminButton>
                      </div>
                    </form>
                    {accessState.error ? (
                      <p className="mt-2 text-xs text-rose-300">{accessState.error}</p>
                    ) : null}
                    {accessState.success ? (
                      <p className="mt-2 text-xs text-emerald-300">{accessState.success}</p>
                    ) : null}
                    {rebateState.error ? (
                      <p className="mt-2 text-xs text-rose-300">{rebateState.error}</p>
                    ) : null}
                    {rebateState.success ? (
                      <p className="mt-2 text-xs text-emerald-300">{rebateState.success}</p>
                    ) : null}
                  </DataPanel>

                  <DataPanel
                    title={
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Conversion Funnel
                      </h3>
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <FunnelMetric label="Invited" value={drawerState.selectedItem.funnel.invited} />
                      <FunnelMetric label="Linked" value={drawerState.selectedItem.funnel.linked} />
                      <FunnelMetric
                        label="Qualified"
                        value={drawerState.selectedItem.funnel.qualified}
                      />
                      <FunnelMetric
                        label="Converted"
                        value={drawerState.selectedItem.funnel.converted}
                      />
                      <FunnelMetric label="Rejected" value={drawerState.selectedItem.funnel.rejected} />
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
                      Conversion Rate:{" "}
                      <span className="font-semibold text-zinc-300">
                        {drawerState.selectedItem.funnel.conversionRate}%
                      </span>
                    </p>
                  </DataPanel>
                </div>
              ) : null}
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Quick Entry
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

function FunnelMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-surface-soft rounded-xl p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
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

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

