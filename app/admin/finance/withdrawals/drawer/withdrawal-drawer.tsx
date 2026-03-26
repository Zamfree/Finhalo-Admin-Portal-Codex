"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { getWithdrawalDrawerTabLabel } from "../../_config";
import { WITHDRAWAL_DRAWER_TABS } from "../../_constants";
import type { WithdrawalDrawerTab, WithdrawalRow } from "../../_types";
import { WithdrawalContextTab } from "./withdrawal-context-tab";
import { WithdrawalHandoffTab } from "./withdrawal-handoff-tab";
import { WithdrawalOverviewTab } from "./withdrawal-overview-tab";
import { WithdrawalReferencesTab } from "./withdrawal-references-tab";

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
            ) : (
              <WithdrawalHandoffTab withdrawal={withdrawal} />
            )}
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Handoff</p>
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
