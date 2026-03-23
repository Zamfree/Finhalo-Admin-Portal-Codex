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

export default async function CommissionBatchDetailPage({ params }: BatchDetailProps) {
  const { batch_id } = await params;

  const batch = { ...MOCK_COMMISSION_BATCH_DETAIL, batch_id };
  const records = MOCK_COMMISSION_BATCH_SOURCE_ROWS;
  const isLocked = batch.status === "locked";
  const needsReview =
    batch.failed_rows > 0 || batch.validation_result !== "passed" || batch.duplicate_result !== "clear";
  const isReady = !isLocked && !needsReview;
  const statusLabel = isLocked ? "LOCKED" : needsReview ? "REVIEW" : isReady ? "READY" : "FAILED";

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

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Batch Status" value={statusLabel} emphasis="strong" />
        <SummaryCard label="Success Rows" value={batch.success_rows.toLocaleString()} emphasis="strong" />
        <SummaryCard label="Failed Rows" value={batch.failed_rows.toLocaleString()} />
        <SummaryCard label="Duplicate Check" value={batch.duplicate_result} />
        <SummaryCard label="Validation Result" value={batch.validation_result} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Batch Overview</h2>}
        description={
          <div className="max-w-2xl space-y-2 text-sm text-zinc-400">
            <p>
              Review batch identity, validation outcome, duplicate checks, and source-file readiness
              before confirming this import workflow.
            </p>
            <p className="text-zinc-500">
              Confirm Import proceeds with import. Cancel Import stops the current workflow.
              Rollback Batch reverses an imported batch at workflow level.
            </p>
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
            <p className="text-sm text-zinc-400">
              {batch.error_count} rows failed validation.
            </p>
            {needsReview ? (
              <p className="text-sm text-amber-300">
                Review duplicate checks and failed rows before continuing this import workflow.
              </p>
            ) : null}
            {records
              .filter((row) => row.result === "failed")
              .map((row) => (
                <div key={`${row.account_number}-${row.symbol}-${row.error}`} className="admin-surface-soft rounded-xl p-3">
                  <p className="font-mono text-sm text-zinc-300">{row.account_number} · {row.symbol}</p>
                  <p className="mt-1 text-sm text-rose-300">{row.error}</p>
                </div>
              ))}
          </div>
        </DataPanel>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Source Data Preview</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            Preview imported source rows before confirm, cancel, export, or rollback decisions.
          </p>
        }
      >
        <BatchRecordsTableClient rows={records} />
      </DataPanel>
    </div>
  );
}
