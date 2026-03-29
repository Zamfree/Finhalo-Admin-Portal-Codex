"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { AdminButton } from "@/components/system/actions/admin-button";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";

import { ACCOUNT_DRAWER_TABS } from "../_constants";
import type {
  AccountDrawerTab,
  TradingAccountRecord,
  TradingAccountRelatedActivity,
} from "../_types";
import { AccountActivityTab } from "./account-activity-tab";
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
              return tab;
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
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Quick Entry
            </p>
            <ReturnContextLink href={`/admin/accounts/${account.account_id}`}>
              <AdminButton variant="ghost">View Details</AdminButton>
            </ReturnContextLink>
            <ReturnContextLink href={`/admin/users/${account.user_id}`}>
              <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
            </ReturnContextLink>
            <ReturnContextLink href="/admin/commission" query={{ query: account.account_id }}>
              <AdminButton variant="secondary">{t("common.actions.viewCommission")}</AdminButton>
            </ReturnContextLink>
            <ReturnContextLink href="/admin/finance/ledger" query={{ account_id: account.account_id }}>
              <AdminButton variant="primary">{t("common.actions.viewFinance")}</AdminButton>
            </ReturnContextLink>
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
