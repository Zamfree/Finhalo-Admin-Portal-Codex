"use client";

import { DataPanel } from "@/components/system/data/data-panel";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import { DrawerBody, DrawerDivider, DrawerHeader } from "@/components/system/drawer/drawer-section";
import { StatusBadge } from "@/components/system/feedback/status-badge";

import { formatAmount } from "../_shared";
import type {
  CommissionBatchQueueItem,
  CommissionBatchSourceRow,
  CommissionDecisionTone,
} from "../_types";
import { BatchWorkflowActions } from "./batch-workflow-actions";
import { BatchRecordsTableClient } from "./[batch_id]/batch-records-table-client";

function getDecisionClass(tone: CommissionDecisionTone) {
  if (tone === "ready") return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (tone === "review") return "border border-amber-500/20 bg-amber-500/10 text-amber-300";
  if (tone === "error") return "border border-rose-500/20 bg-rose-500/10 text-rose-300";
  return "border border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
}

function escapeCsvCell(value: string | number) {
  const text = String(value);

  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }

  return text;
}

function downloadBatchCsv(filename: string, rows: CommissionBatchSourceRow[]) {
  if (rows.length === 0) {
    return;
  }

  const headers = [
    "account_number",
    "symbol",
    "volume",
    "commission_amount",
    "commission_date",
    "result",
    "error",
  ];

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.account_number,
        row.symbol,
        row.volume,
        row.commission_amount,
        row.commission_date,
        row.result,
        row.error ?? "",
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function BatchQueueDrawer({
  item,
  profitThresholdPercent,
  open,
  onOpenChange,
  onClose,
}: {
  item: CommissionBatchQueueItem | null;
  profitThresholdPercent: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}) {
  if (!item) {
    return <AppDrawer open={open} onOpenChange={onOpenChange} title="Batch Decision" width="wide" />;
  }

  const { batch, sourceRows, issueRows, issueSummary, metrics, workflow, decision, guardrailBlocked } =
    item;
  const exportRows = issueRows.length > 0 ? issueRows : sourceRows;

  return (
    <AppDrawer open={open} onOpenChange={onOpenChange} title={batch.batch_id} width="wide">
      <DrawerHeader title={batch.batch_id} description={batch.broker} onClose={onClose} />
      <DrawerDivider />
      <DrawerBody className="space-y-4">
        <DataPanel
          title={
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                Decision Status
              </h3>
              <StatusBadge size="default" toneClassName={getDecisionClass(decision.tone)}>
                {decision.label}
              </StatusBadge>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Invalid Rows" value={issueSummary.invalidRows} />
            <MetricCard label="Duplicate Records" value={issueSummary.duplicateRecords} />
            <MetricCard label="Missing Accounts" value={issueSummary.missingAccounts} />
            <QuietMetaCard label="Source File" value={batch.source_file || "—"} breakAll />
          </div>
        </DataPanel>

        <DataPanel
          title={
            <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Profit Guardrail
            </h3>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <QuietMetaCard
              label="Gross Commission"
              value={formatAmount(metrics?.grossCommission ?? batch.total_commission, "neutral")}
              mono
            />
            <QuietMetaCard
              label="Total Rebates"
              value={formatAmount(metrics?.totalRebates ?? 0, "positive")}
              mono
            />
            <QuietMetaCard
              label="Platform Profit (%)"
              value={
                metrics?.platformProfitPercent !== null && metrics?.platformProfitPercent !== undefined
                  ? `${metrics.platformProfitPercent.toFixed(2)}%`
                  : "Unavailable"
              }
              mono
              alert={guardrailBlocked}
              note={guardrailBlocked ? "Margin below required threshold." : undefined}
            />
          </div>
        </DataPanel>

        <DataPanel
          title={
            <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Actions
            </h3>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <BatchWorkflowActions
                batchId={batch.batch_id}
                isLocked={workflow.isSettled}
                isReady={workflow.isReadyForSettlement}
                needsReview={workflow.needsReview}
                guardrailBlocked={guardrailBlocked}
                mode="detail"
              />
              <button
                type="button"
                onClick={() => downloadBatchCsv(`${batch.batch_id}.csv`, exportRows)}
                disabled={exportRows.length === 0}
                aria-disabled={exportRows.length === 0}
                title={exportRows.length === 0 ? "No problem records available to export." : "Export CSV"}
                className="admin-interactive inline-flex h-11 items-center justify-center rounded-xl px-5 text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-300"
              >
                Export CSV
              </button>
            </div>
            <p className="break-words text-xs text-zinc-500">
              Required profit threshold: {profitThresholdPercent}%
              {exportRows.length === 0 ? " · No records available for export." : ""}
            </p>
          </div>
        </DataPanel>

        <DataPanel
          title={
            <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Problem Records
            </h3>
          }
        >
          <BatchRecordsTableClient rows={issueRows.length > 0 ? issueRows : sourceRows} />
        </DataPanel>
      </DrawerBody>
    </AppDrawer>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-metric-card rounded-md border border-white/[0.05] bg-white/[0.015] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-[1.05rem] tracking-[-0.02em] text-white">{value}</p>
    </div>
  );
}

function QuietMetaCard({
  label,
  value,
  mono = false,
  breakAll = false,
  alert = false,
  note,
}: {
  label: string;
  value: string;
  mono?: boolean;
  breakAll?: boolean;
  alert?: boolean;
  note?: string;
}) {
  return (
    <div className="admin-metric-card rounded-md border border-white/[0.05] bg-white/[0.015] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-[0.95rem] ${
          mono ? "font-mono" : "font-medium"
        } ${
          breakAll ? "break-all" : "break-words"
        } ${alert ? "text-rose-400" : "text-white"}`}
      >
        {value}
      </p>
      {note ? <p className="mt-2 break-words text-[13px] leading-6 text-rose-300">{note}</p> : null}
    </div>
  );
}
