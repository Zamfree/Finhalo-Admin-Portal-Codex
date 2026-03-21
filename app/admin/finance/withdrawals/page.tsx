import { WithdrawalActions } from "@/components/finance/withdrawal-actions";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type WithdrawalRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
};

const MOCK_WITHDRAWALS: WithdrawalRow[] = [
  {
    id: "WDL-3001",
    user_id: "USR-1001",
    amount: 120,
    status: "pending",
    created_at: "2026-03-19T10:15:00Z",
  },
  {
    id: "WDL-3002",
    user_id: "USR-1002",
    amount: 250,
    status: "approved",
    created_at: "2026-03-19T09:20:00Z",
  },
  {
    id: "WDL-3003",
    user_id: "USR-1003",
    amount: 80,
    status: "rejected",
    created_at: "2026-03-18T21:45:00Z",
  },
];

function getStatusClass(status: string) {
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
    key: "user_id",
    header: "User ID",
    cell: (withdrawal) => withdrawal.user_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-300",
  },
  {
    key: "amount",
    header: "Amount",
    cell: (withdrawal) => withdrawal.amount.toLocaleString(),
    headerClassName:
      "py-2.5 pr-6 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-6 text-right tabular-nums text-white",
  },
  {
    key: "status",
    header: "Status",
    cell: (withdrawal) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusClass(
          withdrawal.status
        )}`}
      >
        {withdrawal.status}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Created At",
    cell: (withdrawal) => new Date(withdrawal.created_at).toLocaleString(),
    cellClassName: "py-3 pr-6 text-sm text-zinc-400",
  },
  {
    key: "actions",
    header: "Actions",
    cell: (withdrawal) => (
      <WithdrawalActions
        withdrawalId={withdrawal.id}
        status={withdrawal.status}
      />
    ),
    headerClassName:
      "py-2.5 pr-0 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0 align-middle",
  },
];

export default async function WithdrawalsPage() {
  const withdrawals = MOCK_WITHDRAWALS;

  return (
    <div className="space-y-6 pb-8">
      <DataPanel
        title={
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Admin / Finance
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Withdrawals
            </h1>
          </div>
        }
        description={
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            Static withdrawal workflow preview for admin review.
          </p>
        }
        actions={
          <button
            type="button"
            className="h-11 rounded-xl bg-white/5 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 hover:text-white" disabled
          >
            Bulk review
          </button>
        }
      >
        <DataTable
          columns={withdrawalColumns}
          rows={withdrawals}
          getRowKey={(withdrawal) => withdrawal.id}
          minWidthClassName="min-w-[760px]"
        />
      </DataPanel>
    </div>
  );
}
