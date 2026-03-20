"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type CommissionRecord = {
  commission_id: string;
  batch_id: string;
  broker: string;
  account_id: string;
  amount: number;
  status: "imported" | "validated" | "processed";
  created_at: string;
};

type RebateResult = {
  rebate_id: string;
  user_id: string;
  account_id: string;
  amount: number;
  rebate_type: "trader" | "l1" | "l2";
  status: "pending" | "settled";
  created_at: string;
};

const MOCK_COMMISSIONS: CommissionRecord[] = [
  {
    commission_id: "COM-1001",
    batch_id: "BAT-3001",
    broker: "IC Markets",
    account_id: "ACC-2001",
    amount: 180.5,
    status: "processed",
    created_at: "2026-03-01T08:20:00Z",
  },
  {
    commission_id: "COM-1002",
    batch_id: "BAT-3001",
    broker: "Pepperstone",
    account_id: "ACC-2002",
    amount: 96.2,
    status: "validated",
    created_at: "2026-03-01T09:10:00Z",
  },
  {
    commission_id: "COM-1003",
    batch_id: "BAT-3002",
    broker: "XM",
    account_id: "ACC-2003",
    amount: 210.8,
    status: "imported",
    created_at: "2026-03-02T11:45:00Z",
  },
];

const MOCK_REBATES: RebateResult[] = [
  {
    rebate_id: "REB-5001",
    user_id: "USR-1001",
    account_id: "ACC-2001",
    amount: 120.5,
    rebate_type: "trader",
    status: "settled",
    created_at: "2026-03-01T10:00:00Z",
  },
  {
    rebate_id: "REB-5002",
    user_id: "USR-1001",
    account_id: "ACC-2002",
    amount: 45.2,
    rebate_type: "l1",
    status: "pending",
    created_at: "2026-03-02T12:30:00Z",
  },
  {
    rebate_id: "REB-5003",
    user_id: "USR-1002",
    account_id: "ACC-2003",
    amount: 88.9,
    rebate_type: "l2",
    status: "settled",
    created_at: "2026-03-03T09:10:00Z",
  },
];

const TAB_STYLES =
  "rounded-xl border px-4 py-2 text-sm font-medium transition";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "processed":
    case "settled":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "validated":
    case "pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "imported":
      return "border-blue-500/20 bg-blue-500/10 text-blue-300";
    default:
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
  }
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export default function CommissionPage() {
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab");
  const initialUserId = searchParams.get("user_id") ?? "";
  const initialTab =
    tabFromUrl === "rebate" ? "rebate" : initialUserId ? "rebate" : "commission";

  const [activeTab, setActiveTab] = useState<"commission" | "rebate">(initialTab);
  const [query, setQuery] = useState(initialUserId);

  useEffect(() => {
    const nextTab =
      searchParams.get("tab") === "rebate"
        ? "rebate"
        : searchParams.get("user_id")
          ? "rebate"
          : "commission";

    const nextQuery = searchParams.get("user_id") ?? "";

    setActiveTab(nextTab);
    setQuery(nextQuery);
  }, [searchParams]);

  const filteredCommissions = useMemo(() => {
    return MOCK_COMMISSIONS.filter((record) => {
      const q = query.toLowerCase();
      return (
        record.commission_id.toLowerCase().includes(q) ||
        record.batch_id.toLowerCase().includes(q) ||
        record.broker.toLowerCase().includes(q) ||
        record.account_id.toLowerCase().includes(q)
      );
    });
  }, [query]);

  const filteredRebates = useMemo(() => {
    return MOCK_REBATES.filter((record) => {
      const q = query.toLowerCase();
      return (
        record.rebate_id.toLowerCase().includes(q) ||
        record.user_id.toLowerCase().includes(q) ||
        record.account_id.toLowerCase().includes(q)
      );
    });
  }, [query]);

  const commissionColumns: DataTableColumn<CommissionRecord>[] = [
    {
      key: "commission_id",
      header: "Commission ID",
      cell: (row) => row.commission_id,
      cellClassName: "py-4 pr-4 font-medium text-white",
    },
    {
      key: "batch_id",
      header: "Batch",
      cell: (row) => row.batch_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "broker",
      header: "Broker",
      cell: (row) => row.broker,
      cellClassName: "py-4 pr-4 text-zinc-300",
    },
    {
      key: "account_id",
      header: "Account",
      cell: (row) => row.account_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => `$${row.amount.toFixed(2)}`,
      cellClassName: "py-4 pr-4 text-zinc-200",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "created_at",
      header: "Created At",
      cell: (row) => {
        const date = new Date(row.created_at);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
      },
      cellClassName: "py-4 pr-0 whitespace-nowrap text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];

  const rebateColumns: DataTableColumn<RebateResult>[] = [
    {
      key: "rebate_id",
      header: "Rebate ID",
      cell: (row) => row.rebate_id,
      cellClassName: "py-4 pr-4 font-medium text-white",
    },
    {
      key: "user_id",
      header: "User",
      cell: (row) => row.user_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "account_id",
      header: "Account",
      cell: (row) => row.account_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => `$${row.amount.toFixed(2)}`,
      cellClassName: "py-4 pr-4 text-zinc-200",
    },
    {
      key: "rebate_type",
      header: "Type",
      cell: (row) => row.rebate_type,
      cellClassName: "py-4 pr-4 text-zinc-300",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "created_at",
      header: "Created At",
      cell: (row) => {
        const date = new Date(row.created_at);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
      },
      cellClassName: "py-4 pr-0 whitespace-nowrap text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];

  const totalCommission = filteredCommissions.reduce((sum, row) => sum + row.amount, 0);
  const processedCommission = filteredCommissions
    .filter((row) => row.status === "processed")
    .reduce((sum, row) => sum + row.amount, 0);

  const totalRebate = filteredRebates.reduce((sum, row) => sum + row.amount, 0);
  const settledRebate = filteredRebates
    .filter((row) => row.status === "settled")
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Admin / Commission
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Commission Center</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Review broker commission inputs and rebate calculation outputs in one place.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("commission")}
            className={`${TAB_STYLES} ${activeTab === "commission"
              ? "border-white/10 bg-white/10 text-white"
              : "border-transparent text-zinc-400 hover:text-white"
              }`}
          >
            Broker Commission
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rebate")}
            className={`${TAB_STYLES} ${activeTab === "rebate"
              ? "border-white/10 bg-white/10 text-white"
              : "border-transparent text-zinc-400 hover:text-white"
              }`}
          >
            Rebate Results
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        {query && (
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm">
            <span className="text-zinc-400">
              Filtered by:{" "}
              <span className="font-medium text-white">User = {query}</span>
            </span>

            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-emerald-400 transition hover:text-emerald-300"
            >
              Clear
            </button>
          </div>
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            activeTab === "commission"
              ? "Search commission / batch / broker / account"
              : "Search rebate / user / account"
          }
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-500/40"
        />
      </div>

      {activeTab === "commission" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Total Commission" value={`$${totalCommission.toFixed(2)}`} />
            <SummaryCard label="Processed" value={`$${processedCommission.toFixed(2)}`} />
            <SummaryCard label="Records" value={filteredCommissions.length} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <DataTable
              columns={commissionColumns}
              rows={filteredCommissions}
              getRowKey={(row) => row.commission_id}
              minWidthClassName="min-w-[920px]"
              emptyMessage="No commission records found."
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Total Rebate" value={`$${totalRebate.toFixed(2)}`} />
            <SummaryCard label="Settled" value={`$${settledRebate.toFixed(2)}`} />
            <SummaryCard label="Records" value={filteredRebates.length} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <DataTable
              columns={rebateColumns}
              rows={filteredRebates}
              getRowKey={(row) => row.rebate_id}
              minWidthClassName="min-w-[920px]"
              emptyMessage="No rebate records found."
            />
          </div>
        </>
      )}
    </div>
  );
}