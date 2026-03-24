import Link from "next/link";

import { DataPanel } from "@/components/system/data/data-panel";

import { SummaryCard } from "../../_shared";
import {
  MOCK_COMMISSION_BATCH_DETAIL,
  MOCK_COMMISSION_BATCH_SOURCE_ROWS,
} from "../../_mock-data";
import { BatchWorkflowActions } from "../batch-workflow-actions";
import { BatchRecordsTableClient } from "./batch-records-table-client";

type BatchDetailProps = {
  params: Promise<{
    batch_id: string;
  }>;
};

function getBatchStage(batch: {
  status: string;
  failed_rows: number;
  validation_result: string;
  duplicate_result: string;
}) {
  const isLocked = batch.status === "locked" || batch.status === "confirmed";
  const needsReview =
    batch.failed_rows > 0 ||
    batch.validation_result !== "passed" ||
    batch.duplicate_result !== "clear";

  if (batch.status === "confirmed") return 5;
  if (batch.status === "locked") return 4;
  if (needsReview) return 2;
  if (batch.status === "validated") return 3;
  return 1;
}

function getStageTone(step: number, currentStage: number) {
  if (step < currentStage) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (step === currentStage) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]";
  }

  return "border-white/10 bg-white/[0.03] text-zinc-500";
}

export default async function CommissionBatchDetailPage({ params }: BatchDetailProps) {
  const { batch_id } = await params;

  const batch = { ...MOCK_COMMISSION_BATCH_DETAIL, batch_id };
  const records = MOCK_COMMISSION_BATCH_SOURCE_ROWS;
  const isLocked = batch.status === "locked";
  const needsReview =
    batch.failed_rows > 0 || batch.validation_result !== "passed" || batch.duplicate_result !== "clear";
  const isReady = !isLocked && !needsReview;
  const statusLabel =
    batch.status === "confirmed"
      ? "POSTED"
      : batch.status === "locked"
        ? "READY FOR APPROVAL"
        : needsReview
          ? "REVIEW REQUIRED"
          : batch.status === "validated"
            ? "VALIDATED"
            : "IMPORTED";
  const currentStage = getBatchStage(batch);
  return (
    <div className="space-y-6 pb-8">
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/admin/commission/batches"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Back to batch management
          </Link>
          <span className="admin-surface-soft rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Validation workbench
          </span>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Commission / Batches
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Batch Detail<span className="ml-1.5 inline-block text-amber-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Validation and import decision page for source records, duplicates, failed rows, and rollback readiness.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="grid md:grid-cols-5">
            {[
              { step: 1, label: "Imported", helper: "Batch created and source rows captured" },
              { step: 2, label: "Review", helper: "Validation or duplicate review required" },
              { step: 3, label: "Validated", helper: "Ready for confirm workflow" },
              { step: 4, label: "Locked", helper: "Finalized and no further edits allowed" },
              {
                step: 5,
                label: "Approval & Posting",
                helper: "Admin approval triggers rebate generation and ledger posting"
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`relative px-4 py-4 md:px-5 ${getStageTone(item.step, currentStage)}`}
              >
                {item.step !== 5 && (
                  <div
                    className={`absolute right-0 top-1/2 h-[1px] w-full -translate-y-1/2 ${item.step < currentStage ? "bg-emerald-400/40" : "bg-white/10"
                      }`}
                  />
                )}
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-2.5 w-2.5 rounded-full ${item.step < currentStage
                      ? "bg-emerald-400"
                      : item.step === currentStage
                        ? "bg-amber-300"
                        : "bg-white/20"
                      }`}
                  />
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                      Step {item.step}
                    </p>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-zinc-400">{item.helper}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {isLocked ? (
          <div className="admin-surface-soft mt-5 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              Locked Batch
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              This batch has been finalized and cannot be modified.
            </p>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Current Stage" value={`Step ${currentStage} / 5`} emphasis="strong" />
        <SummaryCard label="Total Commission" value={`$${batch.total_commission.toFixed(2)}`} />
        <SummaryCard label="Success Rows" value={batch.success_rows.toLocaleString()} />
        <SummaryCard label="Failed Rows" value={batch.failed_rows.toLocaleString()} emphasis="strong" />
        <SummaryCard label="Validation Result" value={batch.validation_result} emphasis="strong" />
        <SummaryCard label="Duplicate Result" value={batch.duplicate_result} emphasis="strong" />
        <SummaryCard label="Status" value={statusLabel} emphasis="strong" />
        <SummaryCard label="Imported At" value={new Date(batch.imported_at).toLocaleString()} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Decision Panel</h2>}
        description={
          <div className="max-w-2xl space-y-2 text-sm text-zinc-400">
            <p>
              Review validation results, duplicate checks, and financial impact before approving this batch.
            </p>
            <p className="text-zinc-500">
              Approval will generate rebate records and post ledger entries. This action cannot be undone.
            </p>
            <p className="text-zinc-500">
              description={
                <div className="max-w-2xl space-y-2 text-sm text-zinc-400">
                  <p>
                    Review validation results, duplicate checks, and financial impact before approving this batch.
                  </p>
                  <p className="text-zinc-500">
                    Approval will generate rebate records and post ledger entries. This action cannot be undone.
                  </p>
                </div>
              }            </p>
          </div>
        }
        actions={
          <BatchWorkflowActions
            batchId={batch.batch_id}
            isLocked={isLocked}
            isReady={isReady}
            needsReview={needsReview}
            showExportButton
          />
        }
      >

        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Decision Status
            </p>
            <span className="text-xs font-semibold text-amber-300">
              {statusLabel}
            </span>
          </div>

          {isLocked ? (
            <div>
              <p className="text-sm font-medium text-emerald-300">
                This batch has been finalized.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                No further actions are required. Ledger and rebate flows should already be triggered.
              </p>
            </div>
          ) : needsReview ? (
            <div>
              <p className="text-sm font-medium text-amber-300">
                This batch requires review before approval.
              </p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {batch.failed_rows > 0 && (
                  <li>• {batch.failed_rows} rows failed validation</li>
                )}
                {batch.duplicate_result !== "clear" && (
                  <li>• Duplicate conflicts detected</li>
                )}
                {batch.validation_result !== "passed" && (
                  <li>• Validation result not passed</li>
                )}
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-emerald-300">
                This batch is ready for approval.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                All validation checks passed. You can proceed with approval and posting.
              </p>
            </div>
          )}
        </div>

        <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <p className="text-sm font-medium text-amber-200">
            Financial Impact (Preview)
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Estimated impact after approval
          </p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            <li>• Rebate records will be generated for eligible accounts</li>
            <li>• Finance ledger entries will be posted</li>
            <li>• Platform profit will be calculated and locked</li>
            <li>• Batch will become immutable after posting</li>
          </ul>
        </div>

        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Batch ID</dt>
            <dd className="mt-2 font-mono text-zinc-200">{batch.batch_id}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Broker</dt>
            <dd className="mt-2 text-zinc-200">{batch.broker}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Source File</dt>
            <dd className="mt-2 text-zinc-200">{batch.source_file}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Imported At</dt>
            <dd className="mt-2 text-zinc-200">{new Date(batch.imported_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Status</dt>
            <dd className="mt-2 capitalize text-zinc-200">{batch.status}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Record Count</dt>
            <dd className="mt-2 text-zinc-200">{batch.record_count?.toLocaleString() ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Duplicate Check
            </dt>
            <dd className="mt-2 text-zinc-200">{batch.duplicate_result}</dd>
          </div>

          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Total Commission
            </dt>
            <dd className="mt-2 text-zinc-200">${batch.total_commission.toFixed(2)}</dd>
          </div>
        </dl>
      </DataPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataPanel title={<h2 className="text-xl font-semibold text-white">Validation Summary</h2>}>
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Validation determines whether imported broker rows are ready for confirm or need review.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label="Validation Result" value={batch.validation_result} emphasis="strong" />
              <SummaryCard label="Duplicate Detection" value={batch.duplicate_result} />
              <SummaryCard label="Success Row Count" value={batch.success_rows.toLocaleString()} />
              <SummaryCard label="Failed Row Count" value={batch.error_count.toLocaleString()} />
            </div>
          </div>
        </DataPanel>

        <DataPanel title={<h2 className="text-xl font-semibold text-white">Error Log Preview</h2>}>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-semibold text-rose-300">
                  {batch.error_count} blocking errors
                </span>
              </p>
              <p className="text-xs text-zinc-500">
                These issues must be resolved before approval
              </p>
            </div>
            {needsReview ? (
              <p className="text-sm text-amber-300">
                Review duplicate checks and failed rows before continuing this import workflow.
              </p>
            ) : null}
            {records
              .filter((row) => row.result === "failed")
              .map((row) => (
                <div
                  key={`${row.account_number}-${row.symbol}-${row.error}`}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm text-zinc-300">
                        {row.account_number} · {row.symbol}
                      </p>
                      <p className="mt-1 text-sm text-rose-300">{row.error}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-rose-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-rose-300">
                      Validation Error
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </DataPanel>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Source Data Preview</h2>}
        description={
          <div className="max-w-2xl space-y-2 text-sm text-zinc-400">
            <p>
              Review validation results, duplicate checks, and financial impact before approving this batch.
            </p>
            <p className="text-zinc-500">
              Approval will generate rebate records and post ledger entries. This action cannot be undone.
            </p>
          </div>
        }
      >
        <BatchRecordsTableClient rows={records} />
      </DataPanel>
    </div>
  );
}
