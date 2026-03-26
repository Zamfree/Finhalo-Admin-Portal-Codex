"use client";

import { useMemo } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { useReturnContext } from "@/hooks/use-return-context";

import { COMMISSION_DRAWER_TABS } from "../_constants";
import { formatAmount } from "../_shared";
import type { CommissionDrawerTab, CommissionRecord } from "../_types";

export function CommissionDrawer({
  record,
  open,
  activeTab,
  onChangeTab,
  onOpenChange,
  onClose,
}: {
  record: CommissionRecord | null;
  open: boolean;
  activeTab: CommissionDrawerTab;
  onChangeTab: (tab: CommissionDrawerTab) => void;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}) {
  const { pushWithReturn } = useReturnContext({ source: "commission" });
  const title = useMemo(() => record?.commission_id ?? "Commission Detail", [record]);
  const chain = record
    ? [record.trader_user_id, record.l1_ib_id ?? "—", record.l2_ib_id ?? "—"].join(" -> ")
    : "—";

  function openFinanceReference(nextRecord: CommissionRecord) {
    if (nextRecord.ledger_ref) {
      pushWithReturn("/admin/finance/ledger", {
        ledger_ref: nextRecord.ledger_ref,
      });
      return;
    }

    if (nextRecord.rebate_record_id) {
      pushWithReturn("/admin/finance/ledger", {
        rebate_record_id: nextRecord.rebate_record_id,
      });
    }
  }

  function openAccountReference(nextRecord: CommissionRecord) {
    pushWithReturn(`/admin/accounts/${encodeURIComponent(nextRecord.account_id)}`);
  }

  function openNetworkReference(nextRecord: CommissionRecord) {
    pushWithReturn("/admin/network", {
      detail_account_id: nextRecord.account_id,
      tab: "overview",
      snapshot_id: nextRecord.relationship_snapshot_id ?? undefined,
    });
  }

  return (
    <AppDrawer open={open} onOpenChange={onOpenChange} title={title} width="wide">
      {record ? (
        <>
          <DrawerHeader
            title={record.commission_id}
            description={`${record.trader_email} | ${record.broker}`}
            onClose={onClose}
          />
          <DrawerDivider />
          <DrawerTabs
            tabs={COMMISSION_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={(tab) => (tab === "overview" ? "Overview" : "Links")}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? (
              <div className="space-y-5">
                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Overview
                    </h3>
                  }
                >
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Trader
                      </dt>
                      <dd className="mt-2 text-white">{record.trader_email}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Account
                      </dt>
                      <dd className="mt-2 font-mono text-zinc-300">{record.account_id}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Broker
                      </dt>
                      <dd className="mt-2 text-zinc-300">{record.broker}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Chain
                      </dt>
                      <dd className="mt-2 font-mono text-zinc-300">{chain}</dd>
                    </div>
                  </dl>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Commission Breakdown
                    </h3>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Gross
                      </p>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-white">
                        {formatAmount(record.gross_commission, "neutral")}
                      </p>
                    </div>
                    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Platform
                      </p>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-white">
                        {formatAmount(record.platform_amount, "negative")}
                      </p>
                    </div>
                    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        L2
                      </p>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-white">
                        {formatAmount(
                          record.l2_amount,
                          record.l2_amount > 0 ? "negative" : "neutral"
                        )}
                      </p>
                    </div>
                    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Trader + L1
                      </p>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-white">
                        {formatAmount(record.trader_amount + record.l1_amount, "positive")}
                      </p>
                    </div>
                  </div>
                </DataPanel>
              </div>
            ) : (
              <DataPanel
                title={
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Links
                  </h3>
                }
              >
                <div className="flex flex-wrap gap-3">
                  <AdminButton variant="ghost" onClick={() => openAccountReference(record)}>
                    View Account
                  </AdminButton>
                  <AdminButton variant="ghost" onClick={() => openNetworkReference(record)}>
                    View Network
                  </AdminButton>
                  <AdminButton variant="secondary" onClick={() => openFinanceReference(record)}>
                    View Finance
                  </AdminButton>
                </div>
              </DataPanel>
            )}
          </DrawerBody>
        </>
      ) : null}
    </AppDrawer>
  );
}
