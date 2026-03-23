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

export type LedgerRow = {
  ledger_ref: string;
  entry_type: string;
  beneficiary: string;
  account_id: string;
  trader_user_id: string;
  l1_ib_id?: string | null;
  l2_ib_id?: string | null;
  relationship_snapshot_id?: string | null;
  related_rebate_record: string | null;
  amount: number;
  direction: "credit" | "debit";
  status: "posted" | "pending" | "reversed";
  created_at: string;
};

function getStatusClass(status: LedgerRow["status"]) {
  if (status === "posted") return "bg-emerald-500/10 text-emerald-300";
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

const ledgerColumns: DataTableColumn<LedgerRow>[] = [
  {
    key: "ledger_ref",
    header: "Ledger Ref",
    cell: (row) => row.ledger_ref,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
  },
  {
    key: "entry_type",
    header: "Entry Type",
    cell: (row) => (
      <span className="text-xs uppercase tracking-[0.12em] text-zinc-300">{row.entry_type}</span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "beneficiary",
    header: "Beneficiary",
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
    key: "related_rebate_record",
    header: "Related Rebate Record",
    cell: (row) => row.related_rebate_record ?? "-",
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
  },
  {
    key: "amount",
    header: "Amount",
    cell: (row) => formatAmount(row.amount, row.direction === "credit" ? "positive" : "negative"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "direction",
    header: "Direction",
    cell: (row) => (
      <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">{row.direction}</span>
    ),
    cellClassName: "py-3 pr-4",
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
    key: "created_at",
    header: "Created At",
    cell: (row) => new Date(row.created_at).toLocaleString(),
    cellClassName: "py-3 pr-0 text-sm text-zinc-400",
  },
];

type LedgerPageClientProps = {
  rows: LedgerRow[];
  ledgerRefFilter?: string;
  rebateRecordIdFilter?: string;
  accountIdFilter?: string;
};

export function LedgerPageClient({
  rows,
  ledgerRefFilter,
  rebateRecordIdFilter,
  accountIdFilter,
}: LedgerPageClientProps) {
  const [selectedEntry, setSelectedEntry] = React.useState<LedgerRow | null>(null);

  function getNetworkSnapshotHref(row: LedgerRow) {
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

  const filteredRows = React.useMemo(() => {
    if (ledgerRefFilter) {
      return rows.filter((row) => row.ledger_ref === ledgerRefFilter);
    }

    if (rebateRecordIdFilter) {
      return rows.filter((row) => row.related_rebate_record === rebateRecordIdFilter);
    }

    if (accountIdFilter) {
      return rows.filter((row) => row.account_id === accountIdFilter);
    }

    return rows;
  }, [accountIdFilter, ledgerRefFilter, rebateRecordIdFilter, rows]);

  React.useEffect(() => {
    if (filteredRows.length === 1) {
      setSelectedEntry(filteredRows[0]);
      return;
    }

    setSelectedEntry(null);
  }, [filteredRows]);

  return (
    <>
      <p className="text-sm text-zinc-500">
        Posted, pending, and reversed describe finance record state only.
      </p>
      {ledgerRefFilter || rebateRecordIdFilter ? (
        <p className="text-sm text-zinc-400">
          Filtered from Commission context
          {ledgerRefFilter ? ` by ledger ref ${ledgerRefFilter}` : ""}
          {rebateRecordIdFilter ? ` by rebate record ${rebateRecordIdFilter}` : ""}.
        </p>
      ) : accountIdFilter ? (
        <p className="text-sm text-zinc-400">Filtered by Account: {accountIdFilter}.</p>
      ) : null}
      <DataTable
        columns={ledgerColumns}
        rows={filteredRows}
        getRowKey={(row) => row.ledger_ref}
        minWidthClassName="min-w-[1120px]"
        onRowClick={(row) => setSelectedEntry(row)}
        rowClassName={(row) =>
          filteredRows.length === 1 && row.ledger_ref === filteredRows[0].ledger_ref
            ? "bg-white/[0.03]"
            : ""
        }
        emptyMessage="No ledger entries found."
      />

      <AppDrawer
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
        }}
        title={selectedEntry?.ledger_ref ?? "Ledger Detail"}
        width="wide"
      >
        {selectedEntry ? (
          <>
            <DrawerHeader
              title={selectedEntry.ledger_ref}
              description={`${selectedEntry.beneficiary} | ${selectedEntry.entry_type}`}
              onClose={() => setSelectedEntry(null)}
            />
            <DrawerDivider />
            <DrawerBody>
              <div className="grid gap-6 lg:grid-cols-2">
                <DataPanel title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}>
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Ledger Ref
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedEntry.ledger_ref}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Entry Type
                      </dt>
                      <dd className="text-sm uppercase text-zinc-300">{selectedEntry.entry_type}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Direction
                      </dt>
                      <dd className="text-sm uppercase text-zinc-300">{selectedEntry.direction}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Created At
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {new Date(selectedEntry.created_at).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </DataPanel>
                <DataPanel
                  title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context / Relationship</h3>}
                >
                  <div className="space-y-4">
                    <SummaryCard
                      label="Recorded Amount"
                      value={formatAmount(
                        selectedEntry.amount,
                        selectedEntry.direction === "credit" ? "positive" : "negative"
                      )}
                      emphasis="strong"
                    />
                    <p className="text-sm text-zinc-400">
                      This finance entry traces to the relationship snapshot bound to the
                      originating commission / rebate records.
                    </p>
                    <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Beneficiary
                        </dt>
                        <dd className="text-sm font-medium text-white">{selectedEntry.beneficiary}</dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Account ID
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedEntry.account_id}</dd>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Status
                        </dt>
                        <dd className="text-sm capitalize text-zinc-300">{selectedEntry.status}</dd>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Relationship Chain
                        </dt>
                        <dd className="text-sm text-zinc-300">
                          {selectedEntry.trader_user_id} -&gt; {selectedEntry.l1_ib_id ?? "-"} -&gt;{" "}
                          {selectedEntry.l2_ib_id ?? "-"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </DataPanel>
                <DataPanel
                  title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Related Activity / References</h3>}
                  className="lg:col-span-2"
                >
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Related Rebate Record
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">
                        {selectedEntry.related_rebate_record ?? "—"}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Account ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedEntry.account_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Relationship Snapshot ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">
                        {selectedEntry.relationship_snapshot_id ?? "-"}
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
              <Link href={`/admin/accounts/${selectedEntry.account_id}`}>
                <AdminButton variant="ghost">View Account</AdminButton>
              </Link>
              <Link href={getNetworkSnapshotHref(selectedEntry)}>
                <AdminButton variant="ghost">View Network Snapshot</AdminButton>
              </Link>
              <Link href={`/admin/commission?account_id=${encodeURIComponent(selectedEntry.account_id)}`}>
                <AdminButton variant="secondary">View Commission</AdminButton>
              </Link>
              <AdminButton variant="ghost">Close</AdminButton>
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </>
  );
}
