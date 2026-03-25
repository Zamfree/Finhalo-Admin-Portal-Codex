"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";
import type { UserRow } from "@/types/user";

import { USER_DRAWER_TABS } from "../_constants";
import { UserAccountsTab } from "./user-accounts-tab";
import { UserActivityTab } from "./user-activity-tab";
import { UserHandoffTab } from "./user-handoff-tab";
import { UserOverviewTab } from "./user-overview-tab";

export function UserDrawer({
  user,
  open,
  activeTab,
  onOpenChange,
  onClose,
  onChangeTab,
  ownedAccounts,
  activity,
}: {
  user: UserRow | null;
  open: boolean;
  activeTab: (typeof USER_DRAWER_TABS)[number];
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onChangeTab: (tab: (typeof USER_DRAWER_TABS)[number]) => void;
  ownedAccounts: TradingAccountRecord[];
  activity: {
    commission_summary: string;
    finance_summary: string;
    rebate_summary: string;
  } | null;
}) {
  return (
    <AppDrawer
      open={open && !!user}
      onOpenChange={onOpenChange}
      title={user?.display_name ?? "User"}
      width="wide"
    >
      {user ? (
        <>
          <DrawerHeader
            title={user.display_name}
            description={`${user.email} | ${user.user_id}`}
            onClose={onClose}
          />
          <DrawerTabs
            tabs={USER_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={(tab) => {
              if (tab === "overview") return "Overview";
              if (tab === "accounts") return "Accounts";
              if (tab === "activity") return "Activity";
              return "Handoff";
            }}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? <UserOverviewTab user={user} /> : null}
            {activeTab === "accounts" ? <UserAccountsTab accounts={ownedAccounts} /> : null}
            {activeTab === "activity" && activity ? <UserActivityTab activity={activity} /> : null}
            {activeTab === "handoff" ? (
              <UserHandoffTab user={user} primaryAccount={ownedAccounts[0] ?? null} />
            ) : null}
          </DrawerBody>
        </>
      ) : null}
    </AppDrawer>
  );
}
