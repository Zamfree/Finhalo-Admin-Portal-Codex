"use client";

import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataPanel } from "@/components/system/data/data-panel";
import { FilterBar } from "@/components/system/data/filter-bar";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { UsersTable } from "@/components/system/data/users-table";
import type { UserRow } from "@/types/user";

type DrawerTab = "profile" | "accounts" | "rebates" | "support";
type UserTypeFilter = "all" | "trader" | "ib";

type UserAccount = {
  account_id: string;
  account_no: string;
  broker: string;
  account_type: string;
  status: "active" | "monitoring" | "inactive";
  is_primary?: boolean;
};

type RebateRecord = {
  record_id: string;
  account_no: string;
  rebate_type: "direct" | "level_1" | "level_2";
  amount: number;
  status: "settled" | "pending" | "adjusted";
  created_at: string;
};

type SupportTicket = {
  ticket_id: string;
  subject: string;
  category: "withdrawal" | "account" | "rebate" | "verification";
  status: "open" | "pending" | "resolved";
  priority: "low" | "medium" | "high";
  created_at: string;
};

const MOCK_USERS: UserRow[] = [
  { user_id: "USR-1001", email: "alex@finhalo.test", user_type: "trader", status: "active", created_at: "2026-02-01T10:30:00Z" },
  { user_id: "USR-1002", email: "mia@finhalo.test", user_type: "ib", status: "active", created_at: "2026-02-03T08:14:00Z" },
  { user_id: "USR-1003", email: "sam@finhalo.test", user_type: "trader", status: "active", created_at: "2026-02-06T13:55:00Z" },
  { user_id: "USR-1005", email: "james@finhalo.test", user_type: "trader", status: "active", created_at: "2026-02-12T11:45:00Z" },
  { user_id: "USR-1006", email: "sophia@finhalo.test", user_type: "trader", status: "restricted", created_at: "2026-02-15T09:41:00Z" },
  { user_id: "USR-1007", email: "logan@finhalo.test", user_type: "ib", status: "active", created_at: "2026-02-17T15:20:00Z" },
  { user_id: "USR-1008", email: "ava@finhalo.test", user_type: "trader", status: "active", created_at: "2026-02-20T12:08:00Z" },
  { user_id: "USR-1009", email: "lucas@finhalo.test", user_type: "trader", status: "suspended", created_at: "2026-02-24T07:10:00Z" },
  { user_id: "USR-1010", email: "noah@finhalo.test", user_type: "trader", status: "active", created_at: "2026-02-27T18:30:00Z" },
];

const MOCK_USER_ACCOUNTS: Record<string, UserAccount[]> = {
  "USR-1001": [
    { account_id: "ACC-2001", account_no: "MT5-880102", broker: "IC Markets", account_type: "Standard", status: "active", is_primary: true },
    { account_id: "ACC-2002", account_no: "MT5-880245", broker: "Pepperstone", account_type: "Raw", status: "monitoring" },
  ],
  "USR-1002": [{ account_id: "ACC-2003", account_no: "MT5-880318", broker: "XM", account_type: "Standard", status: "active", is_primary: true }],
  "USR-1003": [{ account_id: "ACC-2004", account_no: "MT5-880401", broker: "Exness", account_type: "Pro", status: "inactive", is_primary: true }],
  "USR-1005": [
    { account_id: "ACC-2005", account_no: "MT5-880512", broker: "IC Markets", account_type: "Raw", status: "active", is_primary: true },
    { account_id: "ACC-2006", account_no: "MT5-880544", broker: "FXTM", account_type: "Standard", status: "active" },
  ],
  "USR-1006": [{ account_id: "ACC-2007", account_no: "MT5-880601", broker: "Pepperstone", account_type: "Razor", status: "monitoring", is_primary: true }],
  "USR-1007": [{ account_id: "ACC-2008", account_no: "MT5-880702", broker: "XM", account_type: "Ultra Low", status: "active", is_primary: true }],
  "USR-1008": [],
  "USR-1009": [{ account_id: "ACC-2009", account_no: "MT5-880903", broker: "IC Markets", account_type: "Standard", status: "active", is_primary: true }],
  "USR-1010": [{ account_id: "ACC-2010", account_no: "MT5-881004", broker: "Exness", account_type: "Pro", status: "inactive", is_primary: true }],
};

const MOCK_USER_REBATES: Record<string, RebateRecord[]> = {
  "USR-1001": [
    { record_id: "REB-3001", account_no: "MT5-880102", rebate_type: "direct", amount: 42.5, status: "settled", created_at: "2026-03-01T09:20:00Z" },
    { record_id: "REB-3002", account_no: "MT5-880245", rebate_type: "level_1", amount: 18.2, status: "pending", created_at: "2026-02-27T14:10:00Z" },
  ],
  "USR-1002": [{ record_id: "REB-3003", account_no: "MT5-880318", rebate_type: "direct", amount: 26.8, status: "settled", created_at: "2026-02-26T11:45:00Z" }],
  "USR-1003": [],
  "USR-1005": [
    { record_id: "REB-3004", account_no: "MT5-880512", rebate_type: "direct", amount: 55.0, status: "settled", created_at: "2026-03-02T08:15:00Z" },
    { record_id: "REB-3005", account_no: "MT5-880544", rebate_type: "level_2", amount: 9.4, status: "adjusted", created_at: "2026-02-24T18:00:00Z" },
  ],
  "USR-1006": [],
  "USR-1007": [{ record_id: "REB-3006", account_no: "MT5-880702", rebate_type: "direct", amount: 31.7, status: "pending", created_at: "2026-03-03T12:30:00Z" }],
  "USR-1008": [],
  "USR-1009": [],
  "USR-1010": [],
};

const MOCK_USER_SUPPORT: Record<string, SupportTicket[]> = {
  "USR-1001": [
    {
      ticket_id: "SUP-22018",
      subject: "Withdrawal timing inquiry",
      category: "withdrawal",
      status: "resolved",
      priority: "medium",
      created_at: "2026-03-01T10:10:00Z",
    },
    {
      ticket_id: "SUP-22041",
      subject: "Account linkage verification",
      category: "account",
      status: "open",
      priority: "high",
      created_at: "2026-03-03T15:20:00Z",
    },
  ],
  "USR-1002": [
    {
      ticket_id: "SUP-22062",
      subject: "Missing rebate clarification",
      category: "rebate",
      status: "pending",
      priority: "medium",
      created_at: "2026-03-04T09:30:00Z",
    },
  ],
  "USR-1003": [],
  "USR-1005": [
    {
      ticket_id: "SUP-22079",
      subject: "KYC document follow-up",
      category: "verification",
      status: "resolved",
      priority: "low",
      created_at: "2026-03-05T08:40:00Z",
    },
  ],
  "USR-1006": [],
  "USR-1007": [],
  "USR-1008": [],
  "USR-1009": [],
  "USR-1010": [],
};

const PAGE_SIZE = 5;
const TAB_LABELS: Record<DrawerTab, string> = {
  profile: "Profile",
  accounts: "Accounts",
  rebates: "Rebates",
  support: "Support",
};

const ACCOUNT_STATUS_STYLES: Record<UserAccount["status"], string> = {
  active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  monitoring: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  inactive: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
};

const REBATE_STATUS_STYLES: Record<RebateRecord["status"], string> = {
  settled: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  adjusted: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
};

const SUPPORT_STATUS_STYLES: Record<SupportTicket["status"], string> = {
  open: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  pending: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  resolved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
};

const SUPPORT_PRIORITY_STYLES: Record<SupportTicket["priority"], string> = {
  low: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
  medium: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  high: "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

const STATUS_BADGE_BASE = "rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide";

function getStatusBadgeClass<T extends string>(styles: Record<T, string>, status: T) {
  return `${STATUS_BADGE_BASE} ${styles[status]}`;
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-surface-soft rounded-xl p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-surface p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      {children}
    </section>
  );
}

export default function UsersPage() {
  const router = useRouter();

  const {
    inputFilters,
    appliedFilters,
    currentPage,
    setCurrentPage,
    setInputFilter,
    applyFilters,
    clearFilters,
    updatePageInUrl,
  } = useTableQueryState({
    filters: {
      user_type: "all",
    },
  });

  const {
    selectedItem: selectedUser,
    isOpen: isDrawerOpen,
    activeTab,
    openDrawer,
    closeDrawer,
    changeTab,
  } = useDrawerQueryState<UserRow, DrawerTab>({
    defaultTab: "profile",
    validTabs: ["profile", "accounts", "rebates", "support"] as const,
    items: MOCK_USERS,
    getItemId: (user) => user.user_id,
  });

  const { user_type: userTypeInput } = inputFilters;

  const { user_type: appliedUserType } = appliedFilters;

  const selectedUserAccounts = selectedUser ? MOCK_USER_ACCOUNTS[selectedUser.user_id] ?? [] : [];
  const selectedUserRebates = selectedUser ? MOCK_USER_REBATES[selectedUser.user_id] ?? [] : [];
  const selectedUserSupport = selectedUser ? MOCK_USER_SUPPORT[selectedUser.user_id] ?? [] : [];

  const accountColumns: DataTableColumn<UserAccount>[] = [
    {
      key: "account_no",
      header: "Account No",
      cell: (account) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{account.account_no}</span>
            {account.is_primary ? (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                Primary
              </span>
            ) : null}
          </div>
          <p className="text-[11px] font-mono text-zinc-500">{account.account_id}</p>
        </div>
      ),
      cellClassName: "py-3 pr-4 align-middle",
    },
    {
      key: "broker",
      header: "Broker",
      cell: (account) => account.broker,
      cellClassName: "py-3 pr-4 text-zinc-300",
    },
    {
      key: "account_type",
      header: "Type",
      cell: (account) => account.account_type,
      cellClassName: "py-3 pr-4 text-zinc-300",
    },
    {
      key: "status",
      header: "Status",
      cell: (account) => (
        <span className={getStatusBadgeClass(ACCOUNT_STATUS_STYLES, account.status)}>
          {account.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (account) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            console.log("view account", account.account_id);
          }}
          className="admin-link-action text-xs font-medium text-emerald-400 hover:text-emerald-300"
        >
          View
        </button>
      ),
      headerClassName: "py-2.5 pr-0 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-0 text-right align-middle",
    },
  ];

  const rebateColumns: DataTableColumn<RebateRecord>[] = [
    {
      key: "record_id",
      header: "Record ID",
      cell: (record) => record.record_id,
      cellClassName: "py-3 pr-4 font-mono text-xs text-zinc-400",
    },
    {
      key: "account_no",
      header: "Account",
      cell: (record) => record.account_no,
      cellClassName: "py-3 pr-4 text-white",
    },
    {
      key: "rebate_type",
      header: "Type",
      cell: (record) => record.rebate_type,
      cellClassName: "py-3 pr-4 text-xs uppercase text-zinc-300",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (record) => `$${record.amount.toFixed(2)}`,
      headerClassName: "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "status",
      header: "Status",
      cell: (record) => (
        <span className={getStatusBadgeClass(REBATE_STATUS_STYLES, record.status)}>
          {record.status}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      cell: (record) => new Date(record.created_at).toLocaleString(),
      cellClassName: "py-3 pr-4 text-xs text-zinc-400",
    },
  ];

  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter((user) => {
      const matchesUserType =
        appliedUserType === "all" || user.user_type === appliedUserType;

      return matchesUserType;
    });
  }, [appliedUserType]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const visibleFrom = totalUsers === 0 ? 0 : startIndex + 1;
  const visibleTo = Math.min(endIndex, totalUsers);

  
    function handlePreviousPage() {
    const nextPage = Math.max(1, safeCurrentPage - 1);
    setCurrentPage(nextPage);
    updatePageInUrl(nextPage);
  }


  function handleNextPage() {
    const nextPage = Math.min(totalPages, safeCurrentPage + 1);
    setCurrentPage(nextPage);
    updatePageInUrl(nextPage);
  }

  function renderDrawerContent() {
    if (!selectedUser) {
      return null;
    }

    if (activeTab === "profile") {
      const totalRebate = selectedUserRebates.reduce((sum, record) => sum + record.amount, 0);
      const activeAccounts = selectedUserAccounts.filter((account) => account.status === "active").length;

      return (
        <div className="space-y-6">
          <DrawerSection title="Overview">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Active Accounts" value={activeAccounts} />
              <SummaryCard label="Total Rebate" value={`$${totalRebate.toFixed(2)}`} />
              <SummaryCard label="Support Tickets" value={selectedUserSupport.length} />
            </div>
          </DrawerSection>

          <DrawerSection title="Identity & Access">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">User ID</p>
                <p className="mt-2 font-mono text-sm text-zinc-200">{selectedUser.user_id}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">User Type</p>
                <p className="mt-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-wide text-zinc-300">
                    {selectedUser.user_type}
                  </span>
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Email</p>
                <p className="mt-2 text-sm text-white">{selectedUser.email}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Joined At</p>
                <p className="mt-2 text-sm text-zinc-300">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Latest Activity</p>
                <p className="mt-2 text-sm text-zinc-300">
                  {selectedUserSupport[0]
                    ? new Date(selectedUserSupport[0].created_at).toLocaleString()
                    : "No recent support activity"}
                </p>
              </div>
            </div>
          </DrawerSection>

          <DrawerSection title="Internal Notes">
            <div className="space-y-3">
              <div className="admin-surface-soft rounded-xl p-4">
                <p className="text-sm leading-6 text-zinc-400">
                  User detail view is ready for future admin actions such as KYC review, hierarchy checks,
                  account restriction notes, and finance/compliance flags.
                </p>
              </div>

              <textarea
                rows={4}
                placeholder="Add internal note..."
                className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
            </div>
          </DrawerSection>
        </div>
      );
    }

    if (activeTab === "accounts") {
      const totalAccounts = selectedUserAccounts.length;
      const activeAccounts = selectedUserAccounts.filter(
        (account) => account.status === "active"
      ).length;
      const monitoringAccounts = selectedUserAccounts.filter(
        (account) => account.status === "monitoring"
      ).length;
      const latestAccount = selectedUserAccounts[0] ?? null;

      return (
        <div className="space-y-6">
          <DrawerSection title="Account Summary">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Total Accounts" value={totalAccounts} />
              <SummaryCard label="Active Accounts" value={activeAccounts} />
              <SummaryCard label="Monitoring" value={monitoringAccounts} />
            </div>
          </DrawerSection>

          <DrawerSection title="Latest Account Snapshot">
            {latestAccount ? (
              <div className="admin-surface-soft rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{latestAccount.account_no}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {latestAccount.broker} · {latestAccount.account_type}
                    </p>
                  </div>

                  <span className={getStatusBadgeClass(ACCOUNT_STATUS_STYLES, latestAccount.status)}>
                    {latestAccount.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-500">
                No account activity available for this user.
              </div>
            )}
          </DrawerSection>

          <DrawerSection title="Trading Accounts">
            {selectedUserAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-500">
                No linked trading accounts for this user.

                <div className="mt-4">
                  <button
                    type="button"
                    className="admin-link-action text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    + Create Account
                  </button>
                </div>
              </div>
            ) : (
              <DataTable
                columns={accountColumns}
                rows={selectedUserAccounts}
                getRowKey={(account) => account.account_id}
                minWidthClassName="min-w-[640px]"
                emptyMessage="No linked trading accounts for this user."
              />
            )}
          </DrawerSection>
        </div>
      );
    }

    if (activeTab === "support") {
      return (
        <div className="space-y-6">
          <DrawerSection title="Support Summary">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Total Tickets" value={selectedUserSupport.length} />
              <SummaryCard
                label="Open / Pending"
                value={
                  selectedUserSupport.filter(
                    (ticket) => ticket.status === "open" || ticket.status === "pending"
                  ).length
                }
              />
              <SummaryCard
                label="Resolved"
                value={selectedUserSupport.filter((ticket) => ticket.status === "resolved").length}
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Support History">
            {selectedUserSupport.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-500">
                No support tickets found for this user.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedUserSupport.map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    className="admin-surface-soft rounded-xl p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">{ticket.ticket_id}</p>
                        <p className="text-sm text-zinc-300">{ticket.subject}</p>
                        <p className="text-xs text-zinc-500">
                          {ticket.category} · {new Date(ticket.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={getStatusBadgeClass(
                            SUPPORT_PRIORITY_STYLES,
                            ticket.priority
                          )}
                        >
                          {ticket.priority}
                        </span>
                        <span
                          className={getStatusBadgeClass(
                            SUPPORT_STATUS_STYLES,
                            ticket.status
                          )}
                        >
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DrawerSection>

          <DrawerSection title="Internal Support Note">
            <textarea
              rows={4}
              placeholder="Add support follow-up note..."
              className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </DrawerSection>
        </div>
      );
    }

    if (activeTab === "rebates") {
      const totalRebate = selectedUserRebates.reduce(
        (sum, record) => sum + record.amount,
        0
      );

      const settledRebate = selectedUserRebates
        .filter((r) => r.status === "settled")
        .reduce((sum, r) => sum + r.amount, 0);

      const pendingRebate = selectedUserRebates
        .filter((r) => r.status === "pending")
        .reduce((sum, r) => sum + r.amount, 0);

      const latestRebate = selectedUserRebates[0] ?? null;

      return (
        <div className="space-y-6">
          {/* 🔹 Summary */}
          <DrawerSection title="Rebate Summary">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Total Rebate" value={`$${totalRebate.toFixed(2)}`} />
              <SummaryCard label="Settled" value={`$${settledRebate.toFixed(2)}`} />
              <SummaryCard label="Pending" value={`$${pendingRebate.toFixed(2)}`} />
            </div>
          </DrawerSection>

          {/* 🔹 Latest Snapshot */}
          <DrawerSection title="Latest Rebate Snapshot">
            {latestRebate ? (
              <div className="admin-surface-soft rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">
                      ${latestRebate.amount.toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {latestRebate.account_no} · {latestRebate.rebate_type}
                    </p>
                  </div>

                  <span
                    className={getStatusBadgeClass(
                      REBATE_STATUS_STYLES,
                      latestRebate.status
                    )}
                  >
                    {latestRebate.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-500">
                No rebate records available.
              </div>
            )}
          </DrawerSection>

          {/* 🔹 Records Preview */}
          <DrawerSection title="Recent Rebate Records">
            <DataTable
              columns={rebateColumns}
              rows={selectedUserRebates.slice(0, 5)}
              getRowKey={(record) => record.record_id}
              minWidthClassName="min-w-[640px]"
              emptyMessage="No rebate records found."
            />
          </DrawerSection>

          {/* 🔹 CTA */}
          <DrawerSection title="Rebate Actions">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!selectedUser) return;
                  router.push(`/admin/commission?tab=rebate&user_id=${selectedUser.user_id}`);
                }}
                className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
              >
                View All Rebates
              </button>

              <button
                type="button"
                className="admin-interactive rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 hover:border-emerald-400/25 hover:bg-emerald-500/15 hover:shadow-[0_10px_24px_rgba(16,185,129,0.08)]"
              >
                Export Records
              </button>
            </div>
          </DrawerSection>
        </div>
      );
    }
    return null;
  }



  const tabButtonClass = (tab: DrawerTab) =>
      `rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] admin-interactive ${activeTab === tab
      ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.16)]"
      : "bg-transparent text-zinc-400 hover:bg-white/[0.07] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.02),0_10px_24px_rgba(0,0,0,0.12)]"
    }`;

  return (
    <>
      <div className="space-y-6 pb-8">
        <DataPanel
          title={
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Directory</p>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Users</h1>
            </div>
          }
          description={
            <p className="text-sm text-zinc-400">
              Reference implementation of the updated table/list visual system.
            </p>
          }
          actions={
            <button
              type="button"
              className="admin-interactive h-11 rounded-xl border border-white/10 bg-white/10 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-100"
            >
              Invite User
            </button>
          }
          filters={
            <FilterBar
              onApply={(event) => {
                event.preventDefault();
                applyFilters();
              }}
              onReset={clearFilters}
              filters={
                <div className="sm:w-[200px]">
                  <label
                    htmlFor="user_type"
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                  >
                    User Type
                  </label>
                  <select
                    id="user_type"
                    name="user_type"
                    value={userTypeInput}
                    onChange={(event) =>
                      setInputFilter("user_type", event.target.value as UserTypeFilter)
                    }
                    className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
                  >
                    <option value="all">All</option>
                    <option value="trader">Trader</option>
                    <option value="ib">IB</option>
                  </select>
                </div>
              }
            />
          }
          footer={
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p>
                Showing {visibleFrom}-{visibleTo} of {totalUsers} users
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={safeCurrentPage === 1}
                  className="admin-interactive-soft rounded-lg border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Page {safeCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={safeCurrentPage === totalPages || totalUsers === 0}
                  className="admin-interactive-soft rounded-lg border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          }
        >
          <UsersTable rows={paginatedUsers} onOpenDetail={openDrawer} />
        </DataPanel>
      </div>

      {isDrawerOpen && selectedUser ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={closeDrawer} />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#101010] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">User Detail</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{selectedUser.email}</h2>
                <p className="mt-2 text-sm text-zinc-400">Review account metadata and quick admin actions.</p>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="admin-interactive-soft rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.12em] text-zinc-300"
              >
                Close
              </button>
            </div>

            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TAB_LABELS) as DrawerTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => changeTab(tab)}
                    className={tabButtonClass(tab)}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">{renderDrawerContent()}</div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                className="admin-interactive-soft rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300"
              >
                Restrict Access
              </button>
              <button
                type="button"
                className="admin-interactive rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              >
                Reset Password
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
