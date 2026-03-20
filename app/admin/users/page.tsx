"use client";

import { useMemo, useState } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { UsersTable } from "@/components/system/data/users-table";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type UserRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

type DrawerTab = "profile" | "accounts" | "rebates" | "support";
type UserAccount = {
  account_id: string;
  account_no: string;
  broker: string;
  account_type: string;
  status: "active" | "monitoring" | "inactive";
};
type RebateRecord = {
  record_id: string;
  account_no: string;
  rebate_type: "direct" | "level_1" | "level_2";
  amount: number;
  status: "settled" | "pending" | "adjusted";
  created_at: string;
};

const MOCK_USERS: UserRow[] = [
  { user_id: "USR-1001", email: "alex@finhalo.test", role: "trader", created_at: "2026-02-01T10:30:00Z" },
  { user_id: "USR-1002", email: "mia@finhalo.test", role: "ib", created_at: "2026-02-03T08:14:00Z" },
  { user_id: "USR-1003", email: "sam@finhalo.test", role: "trader", created_at: "2026-02-06T13:55:00Z" },
  { user_id: "USR-1004", email: "olivia@finhalo.test", role: "admin", created_at: "2026-02-10T16:22:00Z" },
  { user_id: "USR-1005", email: "james@finhalo.test", role: "trader", created_at: "2026-02-12T11:45:00Z" },
  { user_id: "USR-1006", email: "sophia@finhalo.test", role: "trader", created_at: "2026-02-15T09:41:00Z" },
  { user_id: "USR-1007", email: "logan@finhalo.test", role: "ib", created_at: "2026-02-17T15:20:00Z" },
  { user_id: "USR-1008", email: "ava@finhalo.test", role: "trader", created_at: "2026-02-20T12:08:00Z" },
  { user_id: "USR-1009", email: "lucas@finhalo.test", role: "trader", created_at: "2026-02-24T07:10:00Z" },
  { user_id: "USR-1010", email: "noah@finhalo.test", role: "trader", created_at: "2026-02-27T18:30:00Z" },
];
const MOCK_USER_ACCOUNTS: Record<string, UserAccount[]> = {
  "USR-1001": [
    {
      account_id: "ACC-2001",
      account_no: "MT5-880102",
      broker: "IC Markets",
      account_type: "Standard",
      status: "active",
    },
    {
      account_id: "ACC-2002",
      account_no: "MT5-880245",
      broker: "Pepperstone",
      account_type: "Raw",
      status: "monitoring",
    },
  ],
  "USR-1002": [
    {
      account_id: "ACC-2003",
      account_no: "MT5-880318",
      broker: "XM",
      account_type: "Standard",
      status: "active",
    },
  ],
  "USR-1003": [
    {
      account_id: "ACC-2004",
      account_no: "MT5-880401",
      broker: "Exness",
      account_type: "Pro",
      status: "inactive",
    },
  ],
  "USR-1004": [],
  "USR-1005": [
    {
      account_id: "ACC-2005",
      account_no: "MT5-880512",
      broker: "IC Markets",
      account_type: "Raw",
      status: "active",
    },
    {
      account_id: "ACC-2006",
      account_no: "MT5-880544",
      broker: "FXTM",
      account_type: "Standard",
      status: "active",
    },
  ],
  "USR-1006": [
    {
      account_id: "ACC-2007",
      account_no: "MT5-880601",
      broker: "Pepperstone",
      account_type: "Razor",
      status: "monitoring",
    },
  ],
  "USR-1007": [
    {
      account_id: "ACC-2008",
      account_no: "MT5-880702",
      broker: "XM",
      account_type: "Ultra Low",
      status: "active",
    },
  ],
  "USR-1008": [],
  "USR-1009": [
    {
      account_id: "ACC-2009",
      account_no: "MT5-880903",
      broker: "IC Markets",
      account_type: "Standard",
      status: "active",
    },
  ],
  "USR-1010": [
    {
      account_id: "ACC-2010",
      account_no: "MT5-881004",
      broker: "Exness",
      account_type: "Pro",
      status: "inactive",
    },
  ],
};
const MOCK_USER_REBATES: Record<string, RebateRecord[]> = {
  "USR-1001": [
    {
      record_id: "REB-3001",
      account_no: "MT5-880102",
      rebate_type: "direct",
      amount: 42.5,
      status: "settled",
      created_at: "2026-03-01T09:20:00Z",
    },
    {
      record_id: "REB-3002",
      account_no: "MT5-880245",
      rebate_type: "level_1",
      amount: 18.2,
      status: "pending",
      created_at: "2026-02-27T14:10:00Z",
    },
  ],
  "USR-1002": [
    {
      record_id: "REB-3003",
      account_no: "MT5-880318",
      rebate_type: "direct",
      amount: 26.8,
      status: "settled",
      created_at: "2026-02-26T11:45:00Z",
    },
  ],
  "USR-1003": [],
  "USR-1004": [],
  "USR-1005": [
    {
      record_id: "REB-3004",
      account_no: "MT5-880512",
      rebate_type: "direct",
      amount: 55.0,
      status: "settled",
      created_at: "2026-03-02T08:15:00Z",
    },
    {
      record_id: "REB-3005",
      account_no: "MT5-880544",
      rebate_type: "level_2",
      amount: 9.4,
      status: "adjusted",
      created_at: "2026-02-24T18:00:00Z",
    },
  ],
  "USR-1006": [],
  "USR-1007": [
    {
      record_id: "REB-3006",
      account_no: "MT5-880702",
      rebate_type: "direct",
      amount: 31.7,
      status: "pending",
      created_at: "2026-03-03T12:30:00Z",
    },
  ],
  "USR-1008": [],
  "USR-1009": [],
  "USR-1010": [],
};

const PAGE_SIZE = 5;

export default function UsersPage() {
  const [queryInput, setQueryInput] = useState("");
  const [roleInput, setRoleInput] = useState<"all" | "trader" | "ib" | "admin">("all");
  const [sortInput, setSortInput] = useState<"desc" | "asc">("desc");

  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedRole, setAppliedRole] = useState<"all" | "trader" | "ib" | "admin">("all");
  const [appliedSort, setAppliedSort] = useState<"desc" | "asc">("desc");

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>("profile");

  const [currentPage, setCurrentPage] = useState(1);

  function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedQuery(queryInput);
    setAppliedRole(roleInput);
    setAppliedSort(sortInput);
    setCurrentPage(1);
  }

  function handleOpenDetail(user: UserRow) {
    setSelectedUser(user);
    setActiveTab("profile");
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
  setIsDrawerOpen(false);
  setSelectedUser(null);
}
  const selectedUserAccounts = selectedUser
  ? MOCK_USER_ACCOUNTS[selectedUser.user_id] ?? []
  : [];
  function getAccountStatusClass(status: UserAccount["status"]) {
  if (status === "active") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "monitoring") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
}
  function getRebateStatusClass(status: RebateRecord["status"]) {
  if (status === "settled") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
}
   
  const accountColumns: DataTableColumn<UserAccount>[] = [
  {
    key: "account_no",
    header: "Account No",
    cell: (a) => a.account_no,
    cellClassName: "py-4 pr-4 font-medium text-white",
  },
  {
    key: "broker",
    header: "Broker",
    cell: (a) => a.broker,
    cellClassName: "py-4 pr-4 text-zinc-300",
  },
  {
    key: "account_type",
    header: "Type",
    cell: (a) => a.account_type,
    cellClassName: "py-4 pr-4 text-zinc-300",
  },
  {
    key: "status",
    header: "Status",
    cell: (a) => (
      <span
        className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${getAccountStatusClass(a.status)}`}
      >
        {a.status}
      </span>
    ),
  },
  {
    key: "account_id",
    header: "Account ID",
    cell: (a) => a.account_id,
    cellClassName: "py-4 pr-4 text-xs font-mono text-zinc-500",
  },
];

  const rebateColumns: DataTableColumn<RebateRecord>[] = [
  {
    key: "record_id",
    header: "Record ID",
    cell: (r) => r.record_id,
    cellClassName: "py-4 pr-4 font-mono text-xs text-zinc-400",
  },
  {
    key: "account_no",
    header: "Account",
    cell: (r) => r.account_no,
    cellClassName: "py-4 pr-4 text-white",
  },
  {
    key: "rebate_type",
    header: "Type",
    cell: (r) => r.rebate_type,
    cellClassName: "py-4 pr-4 text-zinc-300 uppercase text-xs",
  },
  {
    key: "amount",
    header: "Amount",
    cell: (r) => `$${r.amount.toFixed(2)}`,
    cellClassName: "py-4 pr-4 text-white",
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${getRebateStatusClass(r.status)}`}
    >
      {r.status}
    </span>
    ),
  },
  {
    key: "created_at",
    header: "Date",
    cell: (r) => new Date(r.created_at).toLocaleString(),
    cellClassName: "py-4 pr-4 text-zinc-400 text-xs",
  },
];

  const selectedUserRebates = selectedUser
  ? MOCK_USER_REBATES[selectedUser.user_id] ?? []
  : [];
  
  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter((user) => {
      const keyword = appliedQuery.trim().toLowerCase();

      const matchQuery =
        !keyword ||
        user.email.toLowerCase().includes(keyword) ||
        user.user_id.toLowerCase().includes(keyword);

      const matchRole =
        appliedRole === "all" || user.role === appliedRole;

      return matchQuery && matchRole;
    });
  }, [appliedQuery, appliedRole]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();

      return appliedSort === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [filteredUsers, appliedSort]);

  const totalUsers = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  const visibleFrom = totalUsers === 0 ? 0 : startIndex + 1;
  const visibleTo = Math.min(endIndex, totalUsers);

  function handlePreviousPage() {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }

  function handleNextPage() {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  function renderDrawerContent() {
    if (!selectedUser) return null;

    if (activeTab === "profile") {
      return (
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Profile
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  User ID
                </p>
                <p className="mt-2 font-mono text-sm text-white">
                  {selectedUser.user_id}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Role
                </p>
                <p className="mt-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-wide text-zinc-300">
                    {selectedUser.role}
                  </span>
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Email
                </p>
                <p className="mt-2 text-sm text-white">
                  {selectedUser.email}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Created At
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Notes
            </p>
            <p className="text-sm leading-6 text-zinc-400">
              This is the profile tab placeholder. Later, this can include KYC
              status, referral parent, wallet summary, verification state, and
              admin-only notes.
            </p>
          </section>
        </div>
      );
    }

    if (activeTab === "accounts") {
      return (
        <div className="space-y-6">
         {/* Summary */}
           <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Account Summary
      </p>

        <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Total Accounts
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {selectedUserAccounts.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Active Accounts
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {
              selectedUserAccounts.filter(
                (account) => account.status === "active"
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Brokers Linked
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {new Set(selectedUserAccounts.map((a) => a.broker)).size}
          </p>
        </div>
      </div>
    </section>

    {/* Table */}
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Trading Accounts
      </p>

      {selectedUserAccounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
          No linked trading accounts for this user.
        </div>
      ) : (
        <DataTable
         columns={rebateColumns}
         rows={selectedUserRebates}
         getRowKey={(row) => row.record_id}
         minWidthClassName="min-w-[640px]"
        />
      )}
    </section>
  </div>
);
}

    if (activeTab === "rebates") {
      return (
  <div className="space-y-6">
    {/* Summary */}
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Rebate Summary
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Total Rebate
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            $
            {selectedUserRebates
              .reduce((sum, r) => sum + r.amount, 0)
              .toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Settled
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            $
            {selectedUserRebates
              .filter((r) => r.status === "settled")
              .reduce((sum, r) => sum + r.amount, 0)
              .toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Pending
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            $
            {selectedUserRebates
              .filter((r) => r.status === "pending")
              .reduce((sum, r) => sum + r.amount, 0)
              .toFixed(2)}
          </p>
        </div>
      </div>
    </section>

    {/* Table */}
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Rebate Records
      </p>

      {selectedUserRebates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
          No rebate records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4 text-xs text-zinc-500">Record ID</th>
                <th className="py-3 pr-4 text-xs text-zinc-500">Account</th>
                <th className="py-3 pr-4 text-xs text-zinc-500">Type</th>
                <th className="py-3 pr-4 text-xs text-zinc-500">Amount</th>
                <th className="py-3 pr-4 text-xs text-zinc-500">Status</th>
                <th className="py-3 pr-4 text-xs text-zinc-500">Date</th>
              </tr>
            </thead>

            <tbody>
              {selectedUserRebates.map((r) => (
                <tr key={r.record_id} className="border-b border-white/5">
                  <td className="py-4 pr-4 font-mono text-xs text-zinc-400">
                    {r.record_id}
                  </td>

                  <td className="py-4 pr-4 text-white">
                    {r.account_no}
                  </td>

                  <td className="py-4 pr-4 text-zinc-300 uppercase text-xs">
                    {r.rebate_type}
                  </td>

                  <td className="py-4 pr-4 text-white">
                    ${r.amount.toFixed(2)}
                  </td>

                  <td className="py-4 pr-4 text-zinc-300 uppercase text-xs">
                    {r.status}
                  </td>

                  <td className="py-4 pr-4 text-zinc-400 text-xs">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </div>
);
    }

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Support History
          </p>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Ticket #SUP-22018
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Withdrawal timing inquiry
                  </p>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-300">
                  Resolved
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Ticket #SUP-22041
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Account linkage verification
                  </p>
                </div>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-300">
                  Open
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Support Summary
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                Total Tickets
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">6</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                Open
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">1</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                Last Reply
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                2 hours ago
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const tabButtonClass = (tab: DrawerTab) =>
    `rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
      activeTab === tab
        ? "bg-white text-black"
        : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
    }`;

  return (
    <>
      <div className="space-y-6 pb-8">
        <DataPanel
          title={
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Directory
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Users
              </h1>
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
              className="h-11 rounded-xl bg-white/10 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-100 hover:bg-white/15"
            >
              Invite User
            </button>
          }
          filters={
            <form
              onSubmit={handleApply}
              className="grid gap-3 md:grid-cols-[1fr_200px_200px_180px] md:items-end"
            >
              <div>
                <label
                  htmlFor="query"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                >
                  Search users
                </label>
                <input
                  id="query"
                  name="query"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Search by email or user ID"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                >
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={roleInput}
                  onChange={(e) =>
                    setRoleInput(e.target.value as "all" | "trader" | "ib" | "admin")
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-sm text-zinc-200 outline-none transition focus:border-emerald-500/50"
                >
                  <option value="all">All</option>
                  <option value="trader">Trader</option>
                  <option value="ib">IB</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sort"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                >
                  Sort
                </label>
                <select
                  id="sort"
                  name="sort"
                  value={sortInput}
                  onChange={(e) => setSortInput(e.target.value as "desc" | "asc")}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-sm text-zinc-200 outline-none transition focus:border-emerald-500/50"
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>

              <button
                type="submit"
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 hover:bg-white/10"
              >
                Apply
              </button>
            </form>
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
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/5"
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
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/5"
                >
                  Next
                </button>
              </div>
            </div>
          }
        >
          <UsersTable rows={paginatedUsers} onOpenDetail={handleOpenDetail} />
        </DataPanel>
      </div>

      {isDrawerOpen && selectedUser ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={handleCloseDrawer}
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#101010] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  User Detail
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {selectedUser.email}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Review account metadata and quick admin actions.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDrawer}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.12em] text-zinc-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={tabButtonClass("profile")}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("accounts")}
                  className={tabButtonClass("accounts")}
                >
                  Accounts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("rebates")}
                  className={tabButtonClass("rebates")}
                >
                  Rebates
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className={tabButtonClass("support")}
                >
                  Support
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {renderDrawerContent()}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 hover:bg-white/5"
              >
                Suspend
              </button>
              <button
                type="button"
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/15"
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