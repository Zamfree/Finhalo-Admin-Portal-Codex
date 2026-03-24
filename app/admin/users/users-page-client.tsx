"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";
import { DataTable } from "@/components/system/data/data-table";
import { DataPanel } from "@/components/system/data/data-panel";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import type { UserRow } from "@/types/user";

import { getAccountsForUser, MOCK_USER_ACTIVITY_SUMMARY } from "./_mock-data";
import { userColumns } from "./_shared";

// Helper function to get status class, now co-located with the component that uses it in the drawer.
function getStatusClass(status: UserRow["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "restricted") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export function UsersPageClient({ rows }: { rows: UserRow[] }) {
  const {
    selectedItem: selectedUser,
    isOpen,
    activeTab,
    openDrawer,
    closeDrawer,
    changeTab,
  } = useDrawerQueryState({
    items: rows,
    getItemId: (item) => item.user_id,
    defaultTab: "overview",
    validTabs: ["overview", "accounts", "activity"] as const
  });
  const {
    inputFilters,
    appliedFilters,
    setInputFilter,
    applyFilters,
    clearFilters,
  } = useTableQueryState({
    filters: {
      query: "",
      status: "all",
    },
  });
  const filteredRows = useMemo(() => {
    const normalizedQuery = appliedFilters.query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.user_id.toLowerCase().includes(normalizedQuery) ||
        row.email.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        appliedFilters.status === "all" || row.status === appliedFilters.status;
      return matchesQuery && matchesStatus;
    });
  }, [appliedFilters, rows]);

  // Memoize the user accounts to avoid re-calculating on every render of the drawer.
  const userAccounts = useMemo(() => {
    if (!selectedUser?.user_id) return [];
    return getAccountsForUser(selectedUser.user_id);
  }, [selectedUser?.user_id]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_220px]">
        <input
          value={inputFilters.query}
          onChange={(event) => setInputFilter("query", event.target.value)} placeholder="Search users by email or ID"
          className="admin-interactive h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none"
        />
        <AdminSelect
          value={inputFilters.status}
          onValueChange={(value) => setInputFilter("status", value)}
          placeholder="Filter by status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "restricted", label: "Restricted" },
            { value: "suspended", label: "Suspended" },
          ]}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <AdminButton variant="ghost" onClick={clearFilters}>
          Clear
        </AdminButton>
        <AdminButton variant="primary" onClick={applyFilters}>
          Apply Filters
        </AdminButton>
      </div>

      <DataTable
        columns={userColumns}
        rows={filteredRows}
        getRowKey={(row) => row.user_id}
        minWidthClassName="min-w-[980px]"
        emptyMessage="No users match the current search and filters."
        onRowClick={(row) => openDrawer(row)} />

      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        title={selectedUser?.email ?? "User Detail"}
        width="wide"
      >
        {selectedUser ? (
          <>
            <DrawerHeader
              title={selectedUser.email}
              description="Identity and owner context with downstream account-level handoff."
              onClose={closeDrawer} />
            <DrawerTabs
              tabs={["overview", "accounts", "activity"] as const} activeTab={activeTab}
              onChange={changeTab}
              getLabel={(tab) => {
                if (tab === "overview") return "Overview";
                if (tab === "accounts") return "Accounts";
                if (tab === "activity") return "Activity";
                return tab;
              }}
            />
            <DrawerDivider />
            <DrawerBody>
              {activeTab === "overview" && (
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
                          User ID
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedUser.user_id}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Email
                        </dt>
                        <dd className="text-sm text-white">{selectedUser.email}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Status
                        </dt>
                        <dd>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                              selectedUser.status
                            )}`}
                          >
                            {selectedUser.status}
                          </span>
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Created At
                        </dt>
                        <dd className="text-sm text-zinc-300">
                          {new Date(selectedUser.created_at).toLocaleString()}
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
                    <div className="admin-surface-soft rounded-xl p-4 text-sm text-zinc-400">
                      User-level identity context lives here. Account-level IB relationship detail should be
                      reviewed from the linked trading account.
                    </div>
                  </DataPanel>
                </div>
              )}

              {activeTab === "accounts" && (
                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Owned Trading Accounts
                    </h3>
                  }
                  isEmpty={userAccounts.length === 0}
                  emptyTitle="No trading accounts"
                  emptyDescription="This user has no linked trading accounts yet."
                >
                  <div className="space-y-3">
                    {userAccounts.map((account) => (
                      <div key={account.account_id} className="admin-surface-soft rounded-xl p-4">
                        <p className="font-mono text-sm text-white">{account.account_id}</p>
                        <p className="mt-1 text-sm text-zinc-300">{account.broker}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                          {account.account_type}
                        </p>
                      </div>
                    ))}
                  </div>
                </DataPanel>
              )}

              {activeTab === "activity" && (
                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Related Activity / References
                    </h3>
                  }
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="admin-surface-soft rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Commission
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {MOCK_USER_ACTIVITY_SUMMARY[selectedUser.user_id]?.commission_summary ??
                          "No downstream commission activity yet"}
                      </p>
                    </div>
                    <div className="admin-surface-soft rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Finance
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {MOCK_USER_ACTIVITY_SUMMARY[selectedUser.user_id]?.finance_summary ??
                          "No downstream finance activity yet"}
                      </p>
                    </div>
                    <div className="admin-surface-soft rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Rebate
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {MOCK_USER_ACTIVITY_SUMMARY[selectedUser.user_id]?.rebate_summary ??
                          "No downstream rebate activity yet"}
                      </p>
                    </div>
                  </div>
                </DataPanel>
              )}
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Handoff
              </p>
              {userAccounts[0] ? (
                <Link href={`/admin/accounts/${userAccounts[0].account_id}`}>
                  <AdminButton variant="secondary">View Account</AdminButton>
                </Link>
              ) : (
                <AdminButton variant="secondary" disabled>
                  View Account
                </AdminButton>
              )}
              {userAccounts[0] ? (
                <Link
                  href={`/admin/commission?account_id=${encodeURIComponent(
                    userAccounts[0].account_id
                  )}`}
                >
                  <AdminButton variant="ghost">View Commission</AdminButton>
                </Link>
              ) : (
                <AdminButton variant="ghost" disabled>
                  View Commission
                </AdminButton>
              )}
              {userAccounts[0] ? (
                <Link
                  href={`/admin/finance/ledger?account_id=${encodeURIComponent(
                    userAccounts[0].account_id
                  )}`}
                >
                  <AdminButton variant="primary">View Finance</AdminButton>
                </Link>
              ) : (
                <AdminButton variant="primary" disabled>
                  View Finance
                </AdminButton>
              )}
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}
