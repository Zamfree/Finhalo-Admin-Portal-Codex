import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminCommissionBatches, getAdminCommissionSimulationPreview } from "@/services/admin/commission.service";

import { getCommissionSimulationPosture } from "../_mappers";
import { SummaryCard } from "../_shared";
import { CommissionSimulateClient } from "./commission-simulate-client";

export default async function CommissionSimulatePage() {
  const [preview, batches] = await Promise.all([
    getAdminCommissionSimulationPreview(),
    getAdminCommissionBatches(),
  ]);
  const posture = getCommissionSimulationPosture();
  const pendingSimulationCount = batches.filter(
    (batch) => batch.status === "validated" && !batch.simulation_completed_at
  ).length;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Commission"
        title="Simulation Preview"
        description="Use a controlled parameter preview before approving commission batches."
        accentClassName="bg-amber-400"
        actions={
          <ReturnToContextButton
            fallbackPath="/admin/commission"
            label="Back to Queue"
            variant="ghost"
            className="h-11 px-5"
          />
        }
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Current Stage" value={posture.stageLabel} emphasis="strong" />
        <SummaryCard label="Pending Simulation" value={pendingSimulationCount} />
        <SummaryCard label="Downstream Module" value={posture.linkedModuleLabel} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Simulation Workbench</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            Parameter inputs here are preview-only and never post ledger entries. Final finance effects are
            always decided by backend settlement logic.
          </p>
        }
      >
        <CommissionSimulateClient preview={preview} />
      </DataPanel>
    </div>
  );
}
