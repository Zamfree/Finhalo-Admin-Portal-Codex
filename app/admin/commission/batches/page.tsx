import { DataPanel } from "@/components/system/data/data-panel";

import { SummaryCard } from "../_shared";
import { MOCK_COMMISSION_BATCHES } from "../_mock-data";
import type { CommissionBatch } from "../_types";
import { CommissionBatchesTableClient } from "./batches-table-client";

function getWorkflowState(row: CommissionBatch) {
  const isLocked = row.status === "locked" || row.status === "confirmed";
  const needsReview =
    row.failed_rows > 0 || row.validation_result !== "passed" || row.duplicate_result !== "clear";
  const isReady = !isLocked && !needsReview && row.status === "validated";

  return { isLocked, needsReview, isReady };
}

export default function CommissionBatchesPage() {
  const lockedBatchCount = MOCK_COMMISSION_BATCHES.filter((row) => getWorkflowState(row).isLocked).length;
  const reviewBatchCount = MOCK_COMMISSION_BATCHES.filter((row) => getWorkflowState(row).needsReview).length;
  const readyBatchCount = MOCK_COMMISSION_BATCHES.filter((row) => getWorkflowState(row).isReady).length;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Commission Batches
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Batch Management<span className="ml-1.5 inline-block text-amber-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Operational workflow for imported commission batches, validation review, duplicate checks,
          confirm readiness, and rollback control before records move downstream.
        </p>
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Imported Batches" value={MOCK_COMMISSION_BATCHES.length} emphasis="strong" />
        <SummaryCard label="Ready to Confirm" value={readyBatchCount} />
        <SummaryCard label="Needs Review" value={reviewBatchCount} />
        <SummaryCard label="Locked Batches" value={lockedBatchCount} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Imported Batches</h2>}
        description={
          <div className="max-w-2xl space-y-2 text-sm text-zinc-400">
            <p>
              Review import outcomes, validation results, duplicate checks, and rollback readiness
              before confirming a broker batch into the commission pipeline.
            </p>
            <p className="text-zinc-500">
              Confirm Import proceeds with import. Cancel Import stops the current workflow.
              Rollback Batch reverses an imported batch at workflow level.
            </p>
          </div>
        }
      >
        <CommissionBatchesTableClient rows={MOCK_COMMISSION_BATCHES} />

        <div className="pt-2 text-sm text-zinc-500">
          Use each batch row to review status-aware workflow availability. Confirm, cancel, and
          rollback are wired through the shared commission batch workflow layer.
        </div>
      </DataPanel>
    </div>
  );
}
