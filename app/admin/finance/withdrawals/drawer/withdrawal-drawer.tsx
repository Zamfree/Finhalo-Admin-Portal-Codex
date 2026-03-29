"use client";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { getWithdrawalDrawerTabLabel } from "../../_config";
import { WITHDRAWAL_DRAWER_TABS } from "../../_constants";
import { formatAmount } from "../../_shared";
import type { WithdrawalDrawerTab, WithdrawalRow } from "../../_types";
import { WithdrawalContextTab } from "./withdrawal-context-tab";
import { WithdrawalHandoffTab } from "./withdrawal-handoff-tab";
import { WithdrawalOverviewTab } from "./withdrawal-overview-tab";
import { WithdrawalReferencesTab } from "./withdrawal-references-tab";
import {
  getWithdrawalChecklist,
  getWithdrawalStepState,
  WITHDRAWAL_WORKFLOW_STEPS,
} from "./withdrawal-audit";

function getStatusClass(status: WithdrawalRow["status"]) {
  if (status === "requested") return "bg-amber-500/10 text-amber-300";
  if (status === "under_review") return "bg-sky-500/10 text-sky-300";
  if (status === "approved") return "bg-emerald-500/10 text-emerald-300";
  if (status === "processing") return "bg-indigo-500/10 text-indigo-300";
  if (status === "completed") return "bg-emerald-500/15 text-emerald-200";
  if (status === "failed") return "bg-rose-500/10 text-rose-300";
  if (status === "cancelled") return "bg-zinc-500/10 text-zinc-300";
  return "bg-rose-500/10 text-rose-300";
}

export function WithdrawalDrawer({
  withdrawal,
  open,
  activeTab,
  onChangeTab,
  onClose,
  onOpenChange,
}: {
  withdrawal: WithdrawalRow | null;
  open: boolean;
  activeTab: WithdrawalDrawerTab;
  onChangeTab: (tab: WithdrawalDrawerTab) => void;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const blockingCount = withdrawal
    ? getWithdrawalChecklist(withdrawal).filter((item) => !item.passed).length
    : 0;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={withdrawal?.withdrawal_id ?? "Withdrawal Detail"}
      width="wide"
    >
      {withdrawal ? (
        <>
          <DrawerHeader
            title={withdrawal.withdrawal_id}
            description={`${withdrawal.beneficiary} | ${withdrawal.account_id}`}
            onClose={onClose}
          />
          <div className="px-5 pb-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge size="default" toneClassName={getStatusClass(withdrawal.status)}>
                  {withdrawal.status}
                </StatusBadge>
                <p className="text-xs text-zinc-400">
                  request {formatAmount(withdrawal.request_amount, "neutral")} | fee{" "}
                  {formatAmount(withdrawal.fee_amount, "negative")} | net{" "}
                  {formatAmount(withdrawal.net_amount, "positive")}
                </p>
              </div>
              <p className="mt-2 break-all font-mono text-xs text-zinc-500">
                destination: {withdrawal.destination}
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-5">
                {WITHDRAWAL_WORKFLOW_STEPS.map((step) => {
                  const state = getWithdrawalStepState(withdrawal.status, step);
                  const stateClassName =
                    state === "completed"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : state === "active"
                      ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                      : state === "terminal"
                      ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                      : "border-white/10 bg-white/[0.02] text-zinc-500";

                  return (
                    <div
                      key={step}
                      className={`rounded-xl border px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] ${stateClassName}`}
                    >
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DrawerDivider />
          <DrawerTabs
            tabs={WITHDRAWAL_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={getWithdrawalDrawerTabLabel}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? (
              <WithdrawalOverviewTab withdrawal={withdrawal} />
            ) : activeTab === "context" ? (
              <WithdrawalContextTab withdrawal={withdrawal} />
            ) : activeTab === "references" ? (
              <WithdrawalReferencesTab withdrawal={withdrawal} />
            ) : null}
          </DrawerBody>
          <DrawerDivider />
          <DrawerBody>
            <WithdrawalHandoffTab withdrawal={withdrawal} showQuickLinks={false} />
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Events: {withdrawal.events?.length ?? 0} | Ledger Links: {withdrawal.linked_ledger_entries?.length ?? 0} | Blocking Checks: {blockingCount}
            </p>
            <p className="ml-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Quick Entry
            </p>
            <ReturnContextLink href={`/admin/users/${withdrawal.user_id}`}>
              <AdminButton variant="ghost">View User</AdminButton>
            </ReturnContextLink>
            {withdrawal.account_id && withdrawal.account_id !== "-" ? (
              <ReturnContextLink href={`/admin/accounts/${withdrawal.account_id}`}>
                <AdminButton variant="secondary">View Account</AdminButton>
              </ReturnContextLink>
            ) : null}
            <ReturnContextLink href="/admin/finance/ledger" query={{ query: withdrawal.withdrawal_id }}>
              <AdminButton variant="ghost">View Ledger</AdminButton>
            </ReturnContextLink>
            {withdrawal.account_id && withdrawal.account_id !== "-" ? (
              <ReturnContextLink
                href="/admin/network"
                query={{ detail_account_id: withdrawal.account_id, tab: "overview" }}
              >
                <AdminButton variant="ghost">View Network</AdminButton>
              </ReturnContextLink>
            ) : null}
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
