"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";

import { ACCOUNT_DRAWER_TABS } from "../_constants";
import type {
  AccountDrawerTab,
  TradingAccountRecord,
  TradingAccountRelatedActivity,
} from "../_types";
import { AccountActivityTab } from "./account-activity-tab";
import { AccountHandoffTab } from "./account-handoff-tab";
import { AccountHistoryTab } from "./account-history-tab";
import { AccountOverviewTab } from "./account-overview-tab";
import { AccountRelationshipTab } from "./account-relationship-tab";

export function AccountDrawer({
  account,
  activity,
  open,
  activeTab,
  onChangeTab,
  onOpenChange,
  onClose,
  t,
}: {
  account: TradingAccountRecord | null;
  activity: TradingAccountRelatedActivity | null;
  open: boolean;
  activeTab: AccountDrawerTab;
  onChangeTab: (tab: AccountDrawerTab) => void;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={account?.account_id ?? t("account.title")}
      width="wide"
    >
      {account ? (
        <>
          <DrawerHeader
            title={account.account_id}
            description={`${account.broker} | ${account.account_type}`}
            onClose={onClose}
          />
          <DrawerDivider />
          <DrawerTabs
            tabs={ACCOUNT_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={(tab) => {
              if (tab === "overview") return t("common.labels.overview");
              if (tab === "relationship") return t("account.relationshipSnapshot");
              if (tab === "history") return t("account.snapshotHistory");
              if (tab === "activity") return t("account.relatedActivity");
              return t("common.labels.handoff");
            }}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? <AccountOverviewTab account={account} t={t} /> : null}
            {activeTab === "relationship" ? (
              <AccountRelationshipTab account={account} t={t} />
            ) : null}
            {activeTab === "history" ? <AccountHistoryTab account={account} t={t} /> : null}
            {activeTab === "activity" && activity ? (
              <AccountActivityTab activity={activity} t={t} />
            ) : null}
            {activeTab === "handoff" ? <AccountHandoffTab account={account} t={t} /> : null}
          </DrawerBody>
        </>
      ) : null}
    </AppDrawer>
  );
}
