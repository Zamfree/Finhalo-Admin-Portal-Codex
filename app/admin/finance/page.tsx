"use client";

import { AdminSelect } from "@/components/system/controls/admin-select";
import { useMemo, useState } from "react";
import { DataPanel } from "@/components/system/data/data-panel";
import { FilterBar } from "@/components/system/data/filter-bar";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type FinanceLedgerRow = {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  created_at: string;
};

const MOCK_LEDGER_ROWS: FinanceLedgerRow[] = [
  {
    id: "LED-9001",
    user_id: "USR-1001",
    transaction_type: "commission",
    amount: 125.4,
    balance_after: 1025.4,
    created_at: "2026-03-18T11:10:00Z",
  },
  {
    id: "LED-9002",
    user_id: "USR-1002",
    transaction_type: "rebate",
    amount: 42.75,
    balance_after: 784.2,
    created_at: "2026-03-18T12:20:00Z",
  },
  {
    id: "LED-9003",
    user_id: "USR-1001",
    transaction_type: "withdrawal",
    amount: -50,
    balance_after: 975.4,
    created_at: "2026-03-19T08:01:00Z",
  },
  {
    id: "LED-9004",
    user_id: "USR-1003",
    transaction_type: "admin_fee",
    amount: -8.25,
    balance_after: 611.95,
    created_at: "2026-03-19T09:41:00Z",
  },
];

const TRANSACTION_TYPES = ["commission", "rebate", "withdrawal", "admin_fee"];

const ledgerColumns: DataTableColumn<FinanceLedgerRow>[] = [
  {
    key: "user_id",
    header: "User ID",
    cell: (row) => row.user_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-300",
  },
  {
    key: "transaction_type",
    header: "Transaction Type",
    cell: (row) => (
      <span className="text-xs uppercase tracking-[0.12em] text-zinc-300">
        {row.transaction_type}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    cell: (row) => row.amount.toLocaleString(),
    headerClassName:
      "py-2.5 pr-6 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-6 text-right tabular-nums text-white",
  },
  {
    key: "balance_after",
    header: "Balance After",
    cell: (row) => row.balance_after.toLocaleString(),
    headerClassName:
      "py-2.5 pr-6 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-6 text-right tabular-nums text-white",
  },
  {
    key: "created_at",
    header: "Created At",
    cell: (row) => new Date(row.created_at).toLocaleString(),
    headerClassName:
      "py-2.5 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0 text-sm text-zinc-400",
  },
];

export default function FinanceLedgerPage() {
  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [transactionTypeInput, setTransactionTypeInput] = useState("all");

  const ledgerRows = useMemo(() => {
    const keyword = appliedQuery.trim().toLowerCase();

    return MOCK_LEDGER_ROWS.filter((row) => {
      const matchesKeyword =
        !keyword ||
        row.user_id.toLowerCase().includes(keyword) ||
        row.transaction_type.toLowerCase().includes(keyword);

      const matchesTransactionType =
        transactionTypeInput === "all" || row.transaction_type === transactionTypeInput;
      return matchesKeyword && matchesTransactionType;
    });
  }, [appliedQuery, transactionTypeInput]);

  return (
    <div className="space-y-6 pb-8">
      <DataPanel
        title={
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Admin / Finance
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Ledger
            </h1>
          </div>
        }
        description={
          <p className="text-sm text-zinc-400">
            Preview-mode ledger with static filters and the same dark data surface
            language used across the dashboard.
          </p>
        }
        filters={
          <FilterBar
            onApply={(event) => {
              event.preventDefault();
              setAppliedQuery(queryInput);
            }}
            onReset={() => {
              setQueryInput("");
              setAppliedQuery("");
            }}
            search={
              <div>
                <label
                  htmlFor="ledger_query"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                >
                  Search
                </label>
                <input
                  id="ledger_query"
                  name="ledger_query"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder="Search ledger by user or transaction"
                  className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                />
              </div>
            }
            filters={
              <>
                <div className="sm:w-[180px]">
                  <label
                    htmlFor="transaction_type"
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                  >
                    Transaction type
                  </label>
                  <AdminSelect
                    value={transactionTypeInput}
                    onValueChange={setTransactionTypeInput}
                    options={[
                      { value: "all", label: "All types" },
                      ...TRANSACTION_TYPES.map((type) => ({
                        value: type,
                        label: type,
                      })),
                    ]}
                  />
                </div>

                <div className="sm:w-[160px]">
                  <label
                    htmlFor="from_date"
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                  >
                    From date
                  </label>
                  <input
                    id="from_date"
                    type="date"
                    name="from_date"
                    className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
                  />
                </div>

                <div className="sm:w-[160px]">
                  <label
                    htmlFor="to_date"
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                  >
                    To date
                  </label>
                  <input
                    id="to_date"
                    type="date"
                    name="to_date"
                    className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
                  />
                </div>
              </>
            }
          />
        }
      >
        <DataTable
          columns={ledgerColumns}
          rows={ledgerRows}
          getRowKey={(row) => row.id}
          minWidthClassName="min-w-[820px]"
        />
      </DataPanel>
    </div>
  );
}
