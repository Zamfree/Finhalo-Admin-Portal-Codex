import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { CsvUploadForm } from "@/components/commissions/csv-upload-form";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminCommissionBatches } from "@/services/admin/commission.service";

import {
  getCommissionBatchWorkflowState,
  getCommissionUploadPosture,
} from "../_mappers";
import { SummaryCard } from "../_shared";

export default async function CommissionUploadPage() {
  const { translations } = await getAdminServerPreferences();
  const batches = await getAdminCommissionBatches();
  const uploadPosture = getCommissionUploadPosture(batches);
  const readyCount = batches.filter(
    (batch) => getCommissionBatchWorkflowState(batch).isReadyForSettlement
  ).length;
  const reviewCount = batches.filter(
    (batch) => getCommissionBatchWorkflowState(batch).needsReview
  ).length;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Commission"
        title={translations.commission.uploadTitle}
        description={translations.commission.uploadDescription}
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
        <SummaryCard label="Current Stage" value={uploadPosture.stageLabel} emphasis="strong" />
        <SummaryCard label="Ready Batches in Queue" value={readyCount} />
        <SummaryCard label="Review Queue" value={reviewCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">{translations.commission.uploadPlaceholderTitle}</h2>}
          description={
            <p className="max-w-2xl text-sm text-zinc-400">
              {translations.commission.uploadPlaceholderDescription}
            </p>
          }
        >
          <CsvUploadForm />
        </DataPanel>

        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">{translations.common.labels.overview}</h2>}
        >
          <dl className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {translations.commission.supportedFormats}
              </dt>
              <dd className="text-zinc-300">CSV, XLSX</dd>
            </div>
            <div className="space-y-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {translations.common.labels.validation}
              </dt>
              <dd className="text-zinc-300">{translations.commission.mappingValidationNote}</dd>
            </div>
            <div className="space-y-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Downstream Module
              </dt>
              <dd className="text-zinc-300">{uploadPosture.linkedModuleLabel}</dd>
            </div>
          </dl>
        </DataPanel>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Upload Workflow</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            Upload is the intake stage of the commission pipeline. The real operational decision
            point comes after validation, mapping review, and duplicate checking.
          </p>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="admin-surface-soft rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              File Intake
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Bring broker source files into the workspace with a clear supported-format boundary.
            </p>
          </div>
          <div className="admin-surface-soft rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Mapping & Validation
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{uploadPosture.nextAction}</p>
          </div>
          <div className="admin-surface-soft rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Downstream Module
            </p>
            <p className="mt-2 text-sm font-medium text-white">{uploadPosture.linkedModuleLabel}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{uploadPosture.reviewNote}</p>
          </div>
        </div>
      </DataPanel>
    </div>
  );
}
