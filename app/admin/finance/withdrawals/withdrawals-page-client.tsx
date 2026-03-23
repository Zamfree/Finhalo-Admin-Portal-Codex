"use client";

import * as React from "react";
import Link from "next/link";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";

import { SummaryCard, formatAmount } from "../_shared";

export type WithdrawalRow = {
  withdrawal_id: string;
  beneficiary: string;
  account_id: string;
  trader_user_id: string;
  l1_ib_id?: string | null;
  l2_ib_id?: string | null;
  relationship_snapshot_id?: string | null;
  amount: number;
  fee: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  wallet_address: string;
  network: string;
};

function getStatusClass(status: WithdrawalRow["status"]) {
  if (status === "pending") {
    return "bg-amber-500/10 text-amber-300";
  }

  if (status === "approved") {
    return "bg-emerald-500/10 text-emerald-300";
  }

  return "bg-rose-500/10 text-rose-300";
}

const withdrawalColumns: DataTableColumn<WithdrawalRow>[] = [
  {
    key: "withdrawal_id",
    header: "Withdrawal ID",
    cell: (row) => row.withdrawal_id,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
  },
  {
    key: "beneficiary",
    header: "User / Beneficiary",
    cell: (row) => <span className="font-medium text-white">{row.beneficiary}</span>,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "account_id",
    header: "Account ID",
    cell: (row) => row.account_id,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
  },
  {
    key: "amount",
    header: "Amount",
    cell: (row) => formatAmount(row.amount, "neutral"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "fee",
    header: "Fee (Gas Fee)",
    cell: (row) => formatAmount(row.fee, "negative"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-300",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusClass(
          row.status
        )}`}
      >
        {row.status}
      </span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "requested_at",
    header: "Requested At",
    cell: (row) => new Date(row.requested_at).toLocaleString(),
    cellClassName: "py-3 pr-4 text-sm text-zinc-400",
  },
];

type WithdrawalsPageClientProps = {
  rows: WithdrawalRow[];
  accountIdFilter?: string;
};

export function WithdrawalsPageClient({ rows, accountIdFilter }: WithdrawalsPageClientProps) {
  const [selectedWithdrawal, setSelectedWithdrawal] = React.useState<WithdrawalRow | null>(null);
  function getNetworkSnapshotHref(row: WithdrawalRow) {
    const params = new URLSearchParams({
      detail_account_id: row.account_id,
      tab: "overview",
    });

    // Future navigation should prefer the exact historical relationship snapshot when available.
    if (row.relationship_snapshot_id) {
      params.set("snapshot_id", row.relationship_snapshot_id);
    }

    return `/admin/network?${params.toString()}`;
  }

  const filteredRows = React.useMemo(
    () => (accountIdFilter ? rows.filter((row) => row.account_id === accountIdFilter) : rows),
    [accountIdFilter, rows]
  );

  return (
    <>
      {accountIdFilter ? (
        <p className="mb-4 text-sm text-zinc-400">Filtered by Account: {accountIdFilter}.</p>
      ) : null}
      <DataTable
        columns={withdrawalColumns}
        rows={filteredRows}
        getRowKey={(row) => row.withdrawal_id}
        minWidthClassName="min-w-[1080px]"
        onRowClick={(row) => setSelectedWithdrawal(row)}
        emptyMessage="No withdrawal requests found."
      />

      <AppDrawer
        open={Boolean(selectedWithdrawal)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedWithdrawal(null);
          }
        }}
        title={selectedWithdrawal?.withdrawal_id ?? "Withdrawal Detail"}
        width="wide"
      >
        {selectedWithdrawal ? (
          <>
            <DrawerHeader
              title={selectedWithdrawal.withdrawal_id}
              description={`${selectedWithdrawal.beneficiary} | ${selectedWithdrawal.account_id}`}
              onClose={() => setSelectedWithdrawal(null)}
            />
            <DrawerDivider />
            <DrawerBody>
              <div className="grid gap-6 lg:grid-cols-2">
                <DataPanel title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}>
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Withdrawal ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedWithdrawal.withdrawal_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Beneficiary
                      </dt>
                      <dd className="text-sm font-medium text-white">{selectedWithdrawal.beneficiary}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Account ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedWithdrawal.account_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Requested At
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {new Date(selectedWithdrawal.requested_at).toLocaleString()}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Status
                      </dt>
                      <dd className="text-sm capitalize text-zinc-300">{selectedWithdrawal.status}</dd>
                    </div>
                  </dl>
                </DataPanel>

                <DataPanel title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context / Relationship</h3>}>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <SummaryCard
                        label="Withdrawal Amount"
                        value={formatAmount(selectedWithdrawal.amount, "neutral")}
                        emphasis="strong"
                      />
                      <SummaryCard
                        label="Gas Fee"
                        value={formatAmount(selectedWithdrawal.fee, "negative")}
                      />
                    </div>
                    <p className="text-sm text-zinc-400">
                      Withdrawal review is anchored to the trading account and its related
                      commission / rebate context.
                    </p>
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Relationship Chain
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {selectedWithdrawal.trader_user_id} -&gt; {selectedWithdrawal.l1_ib_id ?? "-"} -&gt;{" "}
                        {selectedWithdrawal.l2_ib_id ?? "-"}
                      </p>
                    </div>
                  </div>
                </DataPanel>

                <DataPanel
                  title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Related Activity / References</h3>}
                  className="lg:col-span-2"
                >
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Wallet Address
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedWithdrawal.wallet_address}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Network
                      </dt>
                      <dd className="text-sm text-zinc-300">{selectedWithdrawal.network}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Account ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedWithdrawal.account_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Commission Context
                      </dt>
                      <dd className="text-sm text-zinc-300">Linked by account-level withdrawal review.</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Relationship Snapshot ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">
                        {selectedWithdrawal.relationship_snapshot_id ?? "-"}
                      </dd>
                    </div>
                  </dl>
                </DataPanel>
              </div>
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Handoff
              </p>
              <Link href={`/admin/accounts/${selectedWithdrawal.account_id}`}>
                <AdminButton variant="ghost">View Account</AdminButton>
              </Link>
              <Link
                href={getNetworkSnapshotHref(selectedWithdrawal)}
              >
                <AdminButton variant="ghost">View Network Snapshot</AdminButton>
              </Link>
              <Link href={`/admin/commission?account_id=${encodeURIComponent(selectedWithdrawal.account_id)}`}>
                <AdminButton variant="secondary">View Commission</AdminButton>
              </Link>
              <AdminButton variant="secondary">Approve</AdminButton>
              <AdminButton variant="destructive">Reject</AdminButton>
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </>
  );
}
