"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { DataPanel } from "@/components/system/data/data-panel";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import type { UserRow } from "@/types/user";

import { getAccountsForUser, MOCK_USER_ACTIVITY_SUMMARY } from "./_mock-data";

function getStatusClass(status: UserRow["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "restricted") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

const userColumns: DataTableColumn<UserRow>[] = [
  {
    key: "user_id",
    header: "User ID",
    cell: (row) => row.user_id,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
  },
  {
    key: "email",
    header: "Email",
    cell: (row) => <span className="font-medium text-white">{row.email}</span>,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(row.status)}`}>
        {row.status}
      </span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "account_count",
    header: "Account Count",
    cell: (row) => getAccountsForUser(row.user_id).length,
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "primary_context",
    header: "Main Account Context",
    cell: (row) => {
      const account = getAccountsForUser(row.user_id)[0] ?? null;

      return account ? (
        <div className="space-y-1">
          <p className="text-sm text-zinc-300">{account.broker}</p>
          <p className="font-mono text-xs text-zinc-500">{account.account_id}</p>
        </div>
      ) : (
        <span className="text-sm text-zinc-500">No linked account</span>
      );
    },
    cellClassName: "py-3 pr-4",
  },
  {
    key: "created_at",
    header: "Created At",
    cell: (row) => new Date(row.created_at).toLocaleString(),
    cellClassName: "py-3 pr-4 text-sm text-zinc-400",
  },
];

export function UsersPageClient({ rows }: { rows: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.user_id.toLowerCase().includes(normalizedQuery) ||
        row.email.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "all" || row.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users by email or ID"
          className="admin-interactive h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="admin-interactive h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-300 focus:border-white/20 focus:outline-none"
        >
          <option value="all" className="bg-zinc-950 text-zinc-200">
            All statuses
          </option>
          <option value="active" className="bg-zinc-950 text-zinc-200">
            Active
          </option>
          <option value="restricted" className="bg-zinc-950 text-zinc-200">
            Restricted
          </option>
          <option value="suspended" className="bg-zinc-950 text-zinc-200">
            Suspended
          </option>
        </select>
      </div>

      <DataTable
        columns={userColumns}
        rows={filteredRows}
        getRowKey={(row) => row.user_id}
        minWidthClassName="min-w-[980px]"
        emptyMessage="No users match the current search and filters."
        onRowClick={(row) => setSelectedUser(row)}
      />

      <AppDrawer
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        title={selectedUser?.email ?? "User Detail"}
        width="wide"
      >
        {selectedUser ? (
          <>
            <DrawerHeader
              title={selectedUser.email}
              description="Identity and owner context with downstream account-level handoff."
              onClose={() => setSelectedUser(null)}
            />
            <DrawerDivider />
            <DrawerBody>
              <div className="grid gap-6 lg:grid-cols-2">
                <DataPanel title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}>
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
                        <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(selectedUser.status)}`}>
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

                <DataPanel title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context / Relationship</h3>}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Owned Trading Accounts
                      </p>
                      {getAccountsForUser(selectedUser.user_id).length === 0 ? (
                        <div className="admin-surface-soft rounded-xl p-4 text-sm text-zinc-500">
                          —
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getAccountsForUser(selectedUser.user_id).map((account) => (
                            <div key={account.account_id} className="admin-surface-soft rounded-xl p-4">
                              <p className="font-mono text-sm text-white">{account.account_id}</p>
                              <p className="mt-1 text-sm text-zinc-300">{account.broker}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                                {account.account_type}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </DataPanel>

                <DataPanel
                  title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Related Activity / References</h3>}
                  className="lg:col-span-2"
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
              </div>
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Handoff
              </p>
              {getAccountsForUser(selectedUser.user_id)[0] ? (
                <Link href={`/admin/accounts/${getAccountsForUser(selectedUser.user_id)[0].account_id}`}>
                  <AdminButton variant="secondary">View Account</AdminButton>
                </Link>
              ) : (
                <AdminButton variant="secondary" disabled>
                  View Account
                </AdminButton>
              )}
              {getAccountsForUser(selectedUser.user_id)[0] ? (
                <Link
                  href={`/admin/commission?account_id=${encodeURIComponent(
                    getAccountsForUser(selectedUser.user_id)[0].account_id
                  )}`}
                >
                  <AdminButton variant="ghost">View Commission</AdminButton>
                </Link>
              ) : (
                <AdminButton variant="ghost" disabled>
                  View Commission
                </AdminButton>
              )}
              {getAccountsForUser(selectedUser.user_id)[0] ? (
                <Link
                  href={`/admin/finance/ledger?account_id=${encodeURIComponent(
                    getAccountsForUser(selectedUser.user_id)[0].account_id
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
