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
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";
import type { UserOperationalHistory, UserRow } from "../_types";

import { USER_DRAWER_TABS } from "../_constants";
import { UserAccountsTab } from "./user-accounts-tab";
import { UserActivityTab } from "./user-activity-tab";
import { UserHistoryTab } from "./user-history-tab";
import { UserOverviewTab } from "./user-overview-tab";
import { UserRelationshipTab } from "./user-relationship-tab";

export function UserDrawer({
  user,
  open,
  activeTab,
  onOpenChange,
  onClose,
  onChangeTab,
  onEdit,
  ownedAccounts,
  userId,
  activity,
  operationalHistory,
}: {
  user: UserRow | null;
  open: boolean;
  activeTab: (typeof USER_DRAWER_TABS)[number];
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onChangeTab: (tab: (typeof USER_DRAWER_TABS)[number]) => void;
  onEdit?: () => void;
  ownedAccounts: TradingAccountRecord[];
  userId: string | null;
  activity: {
    commission_summary: string;
    finance_summary: string;
    rebate_summary: string;
  } | null;
  operationalHistory: UserOperationalHistory | null;
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
              if (tab === "relationship") return "Relationship";
              if (tab === "history") return "History";
              if (tab === "activity") return "Activity";
              return tab;
            }}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? <UserOverviewTab user={user} /> : null}
            {activeTab === "accounts" ? (
              <UserAccountsTab accounts={ownedAccounts} userId={userId} />
            ) : null}
            {activeTab === "relationship" ? <UserRelationshipTab accounts={ownedAccounts} /> : null}
            {activeTab === "history" ? <UserHistoryTab history={operationalHistory} /> : null}
            {activeTab === "activity" && activity ? <UserActivityTab activity={activity} /> : null}
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Quick Entry
            </p>
            <ReturnContextLink href={`/admin/users/${user.user_id}`}>
              <AdminButton variant="ghost" className="h-10 px-4">
                View User
              </AdminButton>
            </ReturnContextLink>
            {ownedAccounts[0] ? (
              <>
                <ReturnContextLink href={`/admin/accounts/${ownedAccounts[0].account_id}`}>
                  <AdminButton variant="secondary" className="h-10 px-4">
                    View Account
                  </AdminButton>
                </ReturnContextLink>
                <ReturnContextLink
                  href="/admin/commission"
                  query={{ query: ownedAccounts[0].account_id }}
                >
                  <AdminButton variant="ghost" className="h-10 px-4">
                    View Commission
                  </AdminButton>
                </ReturnContextLink>
                <ReturnContextLink
                  href="/admin/finance/ledger"
                  query={{ account_id: ownedAccounts[0].account_id }}
                >
                  <AdminButton variant="ghost" className="h-10 px-4">
                    View Finance
                  </AdminButton>
                </ReturnContextLink>
              </>
            ) : (
              <>
                <ReturnContextLink href="/admin/commission" query={{ query: user.user_id }}>
                  <AdminButton variant="ghost" className="h-10 px-4">
                    View Commission
                  </AdminButton>
                </ReturnContextLink>
                <ReturnContextLink href="/admin/finance/ledger" query={{ user_id: user.user_id }}>
                  <AdminButton variant="ghost" className="h-10 px-4">
                    View Finance
                  </AdminButton>
                </ReturnContextLink>
              </>
            )}
            {onEdit ? (
              <AdminButton variant="ghost" className="h-10 px-4" onClick={onEdit}>
                Edit User
              </AdminButton>
            ) : null}
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
