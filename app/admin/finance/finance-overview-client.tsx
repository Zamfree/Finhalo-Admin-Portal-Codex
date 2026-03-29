"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";

import { formatAmount } from "./_shared";
import type {
  AdjustmentRow,
  FinanceHubData,
  ReconciliationRow,
  WithdrawalRow,
  LedgerRow,
} from "./_types";

type FinanceModuleTab = "ledger" | "withdrawals" | "adjustments" | "reconciliation";

type FinanceOverviewClientProps = {
  data: FinanceHubData;
  labels: {
    ledger: string;
    withdrawals: string;
    adjustments: string;
    reconciliation: string;
  };
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getWithdrawalStatusClass(status: WithdrawalRow["status"]) {
  if (status === "requested") return "bg-amber-500/10 text-amber-300";
  if (status === "under_review") return "bg-sky-500/10 text-sky-300";
  if (status === "approved") return "bg-emerald-500/10 text-emerald-300";
  if (status === "processing") return "bg-indigo-500/10 text-indigo-300";
  if (status === "completed") return "bg-emerald-500/15 text-emerald-200";
  if (status === "rejected") return "bg-rose-500/10 text-rose-300";
  if (status === "failed") return "bg-rose-500/10 text-rose-300";
  return "bg-zinc-500/10 text-zinc-300";
}

function getAdjustmentTypeClass(type: string) {
  return type === "credit"
    ? "bg-emerald-500/10 text-emerald-300"
    : "bg-rose-500/10 text-rose-300";
}

function getReconciliationStatusClass(status: ReconciliationRow["status"]) {
  if (status === "matched") return "bg-emerald-500/10 text-emerald-300";
  if (status === "review") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export function FinanceOverviewClient({ data, labels }: FinanceOverviewClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<FinanceModuleTab>(() => {
    const tab = searchParams.get("module_tab");
    if (
      tab === "ledger" ||
      tab === "withdrawals" ||
      tab === "adjustments" ||
      tab === "reconciliation"
    ) {
      return tab;
    }

    return "ledger";
  });

  useEffect(() => {
    const tab = searchParams.get("module_tab");
    if (
      tab === "ledger" ||
      tab === "withdrawals" ||
      tab === "adjustments" ||
      tab === "reconciliation"
    ) {
      setActiveTab((current) => (current === tab ? current : tab));
      return;
    }

    setActiveTab((current) => (current === "ledger" ? current : "ledger"));
  }, [searchParams]);

  function switchTab(tab: FinanceModuleTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "ledger") {
      params.delete("module_tab");
    } else {
      params.set("module_tab", tab);
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  const ledgerRows = useMemo(() => data.ledgerRows.slice(0, 12), [data.ledgerRows]);
  const withdrawalRows = useMemo(() => data.withdrawals.slice(0, 12), [data.withdrawals]);
  const adjustmentRows = useMemo(() => data.adjustments.slice(0, 12), [data.adjustments]);
  const reconciliationRows = useMemo(
    () => data.reconciliationRows.slice(0, 12),
    [data.reconciliationRows]
  );

  const ledgerColumns = useMemo<DataTableColumn<LedgerRow>[]>(
    () => [
      {
        key: "created_at",
        header: "Timestamp",
        cell: (row) => formatDate(row.created_at),
        cellClassName: "py-2 pr-4 text-zinc-400",
      },
      {
        key: "source_summary",
        header: "Source",
        cell: (row) => row.source_summary,
        cellClassName: "py-2 pr-4 text-zinc-200",
      },
      {
        key: "account_id",
        header: "Account",
        cell: (row) => row.account_id,
        cellClassName: "py-2 pr-4 font-mono text-zinc-300",
      },
      {
        key: "signed_amount",
        header: "Signed Amount",
        cell: (row) =>
          formatAmount(
            row.signed_amount,
            row.signed_amount < 0 ? "negative" : row.signed_amount > 0 ? "positive" : "neutral"
          ),
        headerClassName: "text-right",
        cellClassName: "py-2 pr-0 text-right tabular-nums text-white",
      },
    ],
    []
  );

  const withdrawalColumns = useMemo<DataTableColumn<WithdrawalRow>[]>(
    () => [
      {
        key: "requested_at",
        header: "Requested At",
        cell: (row) => formatDate(row.requested_at),
        cellClassName: "py-2 pr-4 text-zinc-400",
      },
      {
        key: "withdrawal_id",
        header: "Withdrawal ID",
        cell: (row) => row.withdrawal_id,
        cellClassName: "py-2 pr-4 font-mono text-zinc-300",
      },
      {
        key: "beneficiary",
        header: "Beneficiary",
        cell: (row) => row.beneficiary,
        cellClassName: "py-2 pr-4 text-zinc-200",
      },
      {
        key: "request_amount",
        header: "Amount",
        cell: (row) => formatAmount(row.request_amount, "neutral"),
        headerClassName: "text-right",
        cellClassName: "py-2 pr-4 text-right tabular-nums text-white",
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => (
          <StatusBadge toneClassName={getWithdrawalStatusClass(row.status)}>
            {row.status}
          </StatusBadge>
        ),
        cellClassName: "py-2 pr-0",
      },
    ],
    []
  );

  const adjustmentColumns = useMemo<DataTableColumn<AdjustmentRow>[]>(
    () => [
      {
        key: "created_at",
        header: "Created At",
        cell: (row) => formatDate(row.created_at),
        cellClassName: "py-2 pr-4 text-zinc-400",
      },
      {
        key: "adjustment_id",
        header: "Adjustment ID",
        cell: (row) => row.adjustment_id,
        cellClassName: "py-2 pr-4 font-mono text-zinc-300",
      },
      {
        key: "account_id",
        header: "Account",
        cell: (row) => row.account_id,
        cellClassName: "py-2 pr-4 font-mono text-zinc-300",
      },
      {
        key: "adjustment_type",
        header: "Type",
        cell: (row) => (
          <StatusBadge toneClassName={getAdjustmentTypeClass(row.adjustment_type)}>
            {row.adjustment_type}
          </StatusBadge>
        ),
        cellClassName: "py-2 pr-4",
      },
      {
        key: "amount",
        header: "Amount",
        cell: (row) =>
          formatAmount(row.amount, row.adjustment_type === "credit" ? "positive" : "negative"),
        headerClassName: "text-right",
        cellClassName: "py-2 pr-0 text-right tabular-nums text-white",
      },
    ],
    []
  );

  const reconciliationColumns = useMemo<DataTableColumn<ReconciliationRow>[]>(
    () => [
      {
        key: "period",
        header: "Period",
        cell: (row) => row.period,
        cellClassName: "py-2 pr-4 text-zinc-200",
      },
      {
        key: "broker",
        header: "Broker",
        cell: (row) => row.broker,
        cellClassName: "py-2 pr-4 text-zinc-200",
      },
      {
        key: "difference",
        header: "Difference",
        cell: (row) =>
          formatAmount(row.difference, row.difference === 0 ? "neutral" : "negative"),
        headerClassName: "text-right",
        cellClassName: "py-2 pr-4 text-right tabular-nums text-white",
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => (
          <StatusBadge toneClassName={getReconciliationStatusClass(row.status)}>
            {row.status}
          </StatusBadge>
        ),
        cellClassName: "py-2 pr-0",
      },
    ],
    []
  );

  const tabMeta: Record<
    FinanceModuleTab,
    { title: string; description: string; href: string }
  > = {
    ledger: {
      title: labels.ledger,
      description: "Ledger is the financial source of truth. Review latest entries and trace refs.",
      href: "/admin/finance/ledger",
    },
    withdrawals: {
      title: labels.withdrawals,
      description: "Review withdrawal queue posture before moving to detailed operations.",
      href: "/admin/finance/withdrawals",
    },
    adjustments: {
      title: labels.adjustments,
      description: "Inspect manual credits/debits before opening adjustment controls.",
      href: "/admin/finance/adjustments",
    },
    reconciliation: {
      title: labels.reconciliation,
      description: "Inspect broker-to-ledger mismatch posture and open full reconciliation workspace.",
      href: "/admin/finance/reconciliation",
    },
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1 md:grid-cols-4">
        <AdminButton
          variant={activeTab === "ledger" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchTab("ledger")}
        >
          {labels.ledger}
        </AdminButton>
        <AdminButton
          variant={activeTab === "withdrawals" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchTab("withdrawals")}
        >
          {labels.withdrawals}
        </AdminButton>
        <AdminButton
          variant={activeTab === "adjustments" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchTab("adjustments")}
        >
          {labels.adjustments}
        </AdminButton>
        <AdminButton
          variant={activeTab === "reconciliation" ? "secondary" : "ghost"}
          className="h-10 px-3"
          onClick={() => switchTab("reconciliation")}
        >
          {labels.reconciliation}
        </AdminButton>
      </div>

      <div className="admin-surface-soft flex flex-wrap items-start justify-between gap-3 rounded-xl p-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {tabMeta[activeTab].title}
          </p>
          <p className="text-sm text-zinc-300">{tabMeta[activeTab].description}</p>
        </div>
        <Link href={tabMeta[activeTab].href}>
          <AdminButton variant="secondary" className="h-10 px-4">
            Open {tabMeta[activeTab].title}
          </AdminButton>
        </Link>
      </div>

      {activeTab === "ledger" ? (
        <DataTable
          columns={ledgerColumns}
          rows={ledgerRows}
          getRowKey={(row) => row.ledger_ref}
          minWidthClassName="min-w-[980px]"
          rowClassName="text-zinc-200"
          emptyMessage="No ledger entries available."
        />
      ) : null}

      {activeTab === "withdrawals" ? (
        <DataTable
          columns={withdrawalColumns}
          rows={withdrawalRows}
          getRowKey={(row) => row.withdrawal_id}
          minWidthClassName="min-w-[1080px]"
          rowClassName="text-zinc-200"
          emptyMessage="No withdrawal requests available."
        />
      ) : null}

      {activeTab === "adjustments" ? (
        <DataTable
          columns={adjustmentColumns}
          rows={adjustmentRows}
          getRowKey={(row) => row.adjustment_id}
          minWidthClassName="min-w-[980px]"
          rowClassName="text-zinc-200"
          emptyMessage="No adjustment records available."
        />
      ) : null}

      {activeTab === "reconciliation" ? (
        <DataTable
          columns={reconciliationColumns}
          rows={reconciliationRows}
          getRowKey={(row) => `${row.period}-${row.broker}`}
          minWidthClassName="min-w-[980px]"
          rowClassName="text-zinc-200"
          emptyMessage="No reconciliation entries available."
        />
      ) : null}
    </div>
  );
}
