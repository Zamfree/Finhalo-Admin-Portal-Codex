"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import { formatTruncatedCurrencyByMode } from "@/lib/money-display";
import type { ClientWithdrawalHistoryRow, ClientWithdrawalWorkspace } from "./_types";
import {
  createWithdrawalRequestAction,
  type ClientWithdrawalActionState,
} from "./actions";

const INITIAL_STATE: ClientWithdrawalActionState = {};

function formatAmount(value: number, mode: "positive" | "negative" | "neutral" = "neutral") {
  return formatTruncatedCurrencyByMode(value, mode);
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `wdr-${Date.now()}`;
}

function getStatusClass(status: ClientWithdrawalHistoryRow["status"]) {
  if (status === "requested") return "bg-amber-500/10 text-amber-300";
  if (status === "under_review") return "bg-sky-500/10 text-sky-300";
  if (status === "approved") return "bg-emerald-500/10 text-emerald-300";
  if (status === "processing") return "bg-indigo-500/10 text-indigo-300";
  if (status === "completed") return "bg-emerald-500/15 text-emerald-200";
  if (status === "failed") return "bg-rose-500/10 text-rose-300";
  if (status === "cancelled") return "bg-zinc-500/10 text-zinc-300";
  return "bg-rose-500/10 text-rose-300";
}

function getHistoryColumns(): DataTableColumn<ClientWithdrawalHistoryRow>[] {
  return [
    {
      key: "withdrawal_id",
      header: "Withdrawal ID",
      cell: (row) => row.withdrawal_id,
      cellClassName: "py-3 pr-4 font-mono text-xs text-zinc-300",
    },
    {
      key: "request_amount",
      header: "Request",
      cell: (row) => formatAmount(row.request_amount, "neutral"),
      cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-100",
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
    {
      key: "fee_amount",
      header: "Fee",
      cell: (row) => formatAmount(row.fee_amount, "negative"),
      cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-300",
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
    {
      key: "net_amount",
      header: "Net",
      cell: (row) => formatAmount(row.net_amount, "positive"),
      cellClassName: "py-3 pr-4 text-right tabular-nums text-emerald-200",
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge size="default" toneClassName={getStatusClass(row.status)}>
          {row.status}
        </StatusBadge>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "requested_at",
      header: "Requested",
      cell: (row) => new Date(row.requested_at).toLocaleString(),
      cellClassName: "py-3 pr-4 text-xs text-zinc-400",
    },
    {
      key: "rejection_reason",
      header: "Rejection Reason",
      cell: (row) => row.rejection_reason ?? "-",
      cellClassName: "py-3 pr-4 text-xs text-zinc-400",
    },
  ];
}

export function WithdrawalsPageClient({ workspace }: { workspace: ClientWithdrawalWorkspace }) {
  const [state, formAction, isPending] = useActionState(createWithdrawalRequestAction, INITIAL_STATE);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const [requestAmountInput, setRequestAmountInput] = useState("");
  const [feeAmountInput, setFeeAmountInput] = useState("0");
  const [historyFilter, setHistoryFilter] = useState<"all" | "open" | "completed" | "rejected">("all");
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setIdempotencyKey(createIdempotencyKey());
      router.refresh();
    }
  }, [router, state.success]);

  const availableBalance =
    typeof state.availableAfter === "number" ? state.availableAfter : workspace.available_balance;
  const requestAmount = Number(requestAmountInput);
  const feeAmount = Number(feeAmountInput);
  const normalizedRequestAmount = Number.isFinite(requestAmount) ? Math.max(0, requestAmount) : 0;
  const normalizedFeeAmount = Number.isFinite(feeAmount) ? Math.max(0, feeAmount) : 0;
  const previewNet = Math.max(0, normalizedRequestAmount - normalizedFeeAmount);
  const previewAvailableAfter = availableBalance - normalizedRequestAmount;
  const exceedsAvailable = normalizedRequestAmount > availableBalance;
  const invalidFee = normalizedFeeAmount > normalizedRequestAmount && normalizedRequestAmount > 0;

  const filteredHistoryRows = useMemo(() => {
    if (historyFilter === "open") {
      return workspace.rows.filter((row) =>
        ["requested", "under_review", "approved", "processing"].includes(row.status)
      );
    }

    if (historyFilter === "completed") {
      return workspace.rows.filter((row) => row.status === "completed");
    }

    if (historyFilter === "rejected") {
      return workspace.rows.filter((row) =>
        row.status === "rejected" || row.status === "failed" || row.status === "cancelled"
      );
    }

    return workspace.rows;
  }, [historyFilter, workspace.rows]);

  const historyCounts = {
    open: workspace.rows.filter((row) =>
      ["requested", "under_review", "approved", "processing"].includes(row.status)
    ).length,
    completed: workspace.rows.filter((row) => row.status === "completed").length,
    rejected: workspace.rows.filter((row) =>
      row.status === "rejected" || row.status === "failed" || row.status === "cancelled"
    ).length,
  };

  if (!workspace.authenticated) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        Please sign in to view and submit withdrawal requests.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Withdrawable Balance (Server Truth)
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">{formatAmount(availableBalance, "neutral")}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Balance is derived server-side from posted ledger entries minus open withdrawal holds.
        </p>
      </div>

      <form action={formAction} className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Create Withdrawal Request</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Request amount, fee, and net payout are recorded explicitly and verified server-side.
        </p>

        <input type="hidden" name="idempotency_key" value={idempotencyKey} />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Account
            </label>
            <select
              name="account_id"
              defaultValue=""
              className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
            >
              <option value="">All eligible balances</option>
              {workspace.accounts.map((account) => (
                <option key={account.account_id} value={account.account_id}>
                  {account.account_id}
                  {account.account_number ? ` (${account.account_number})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Currency
            </label>
            <input
              name="currency"
              defaultValue="USD"
              maxLength={10}
              className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Request Amount
            </label>
            <input
              name="request_amount"
              type="number"
              min="0.00000001"
              step="0.00000001"
              required
              value={requestAmountInput}
              onChange={(event) => setRequestAmountInput(event.target.value)}
              className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Fee Amount
            </label>
            <input
              name="fee_amount"
              type="number"
              min="0"
              step="0.00000001"
              value={feeAmountInput}
              onChange={(event) => setFeeAmountInput(event.target.value)}
              className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Payout Method
            </label>
            <select
              name="payout_method"
              defaultValue="wallet_transfer"
              className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
            >
              <option value="wallet_transfer">Wallet Transfer</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="stablecoin_transfer">Stablecoin Transfer</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Payout Destination
            </label>
            <input
              name="wallet_address"
              required
              placeholder="Wallet address or payout destination"
              className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <PreviewCard label="Expected Net (Preview)" value={formatAmount(previewNet, "positive")} />
          <PreviewCard label="Available After Request (Preview)" value={formatAmount(previewAvailableAfter, "neutral")} />
          <PreviewCard label="Available Now" value={formatAmount(availableBalance, "neutral")} />
        </div>

        <button
          type="submit"
          disabled={isPending || exceedsAvailable || invalidFee}
          className="admin-button admin-button-primary mt-5 inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-medium uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Submitting..." : "Submit Withdrawal Request"}
        </button>

        {exceedsAvailable ? (
          <p className="mt-3 text-sm text-amber-300">
            Request amount exceeds current withdrawable balance.
          </p>
        ) : null}
        {invalidFee ? (
          <p className="mt-3 text-sm text-amber-300">
            Fee amount cannot exceed request amount.
          </p>
        ) : null}
        {state.error ? <p className="mt-3 text-sm text-rose-300">{state.error}</p> : null}
        {state.success ? <p className="mt-3 text-sm text-emerald-300">{state.success}</p> : null}
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Withdrawal History</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Requested status does not mean funds are completed. Final payout is reflected only when status becomes completed.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatusCountCard label="Open" value={historyCounts.open} tone="amber" />
          <StatusCountCard label="Completed" value={historyCounts.completed} tone="emerald" />
          <StatusCountCard label="Rejected / Failed / Cancelled" value={historyCounts.rejected} tone="rose" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterButton active={historyFilter === "all"} onClick={() => setHistoryFilter("all")}>
            All
          </FilterButton>
          <FilterButton active={historyFilter === "open"} onClick={() => setHistoryFilter("open")}>
            Open
          </FilterButton>
          <FilterButton
            active={historyFilter === "completed"}
            onClick={() => setHistoryFilter("completed")}
          >
            Completed
          </FilterButton>
          <FilterButton
            active={historyFilter === "rejected"}
            onClick={() => setHistoryFilter("rejected")}
          >
            Rejected/Failed/Cancelled
          </FilterButton>
        </div>

        <div className="mt-4">
          <DataTable
            columns={getHistoryColumns()}
            rows={filteredHistoryRows}
            getRowKey={(row) => row.withdrawal_id}
            minWidthClassName="min-w-[980px]"
            emptyMessage="No withdrawal history found."
          />
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-200">{value}</p>
    </div>
  );
}

function StatusCountCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "emerald" | "rose";
}) {
  const colorClass =
    tone === "amber" ? "text-amber-300" : tone === "emerald" ? "text-emerald-300" : "text-rose-300";
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${colorClass}`}>{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition ${
        active
          ? "border-sky-300/50 bg-sky-400/10 text-sky-200"
          : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
