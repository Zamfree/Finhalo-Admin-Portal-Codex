"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  applyCommissionResolutionBulkAction,
  applyCommissionMappingTemplateAction,
  loadCommissionBatchResolutionAction,
  runCommissionBatchValidationAction,
  runCommissionBatchSimulationAction,
  saveCommissionStagingResolutionAction,
  uploadCommissionCsv,
} from "@/app/admin/commission/actions";
import {
  ACCOUNT_IDENTIFIER_MAPPING_FIELDS,
  type CommissionCanonicalField,
  COMMISSION_CANONICAL_FIELDS,
  type CommissionUploadMapping,
  REQUIRED_MAPPING_FIELDS,
} from "@/app/admin/commission/upload/_mapping";

type UploadTemplateOption = {
  template_id: string;
  template_name: string;
  broker: string;
  mappings: CommissionUploadMapping;
  is_default: boolean;
};

type UploadActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  duplicateBatchId?: string;
  uploadedFileName?: string;
  rowCount?: number;
  sourceColumns?: string[];
  uploadFingerprint?: string;
  availableTemplates?: UploadTemplateOption[];
};

type MappingActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  mappedRows?: number;
  failedRows?: number;
  mappingStatus?: "mapped" | "failed";
  templateId?: string;
};

type ValidationCategoryCount = {
  code: string;
  count: number;
};

type ValidationSummary = {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  excludedRows: number;
  duplicateRows: number;
  topErrorCategories: ValidationCategoryCount[];
  topWarningCategories: ValidationCategoryCount[];
};

type ValidationActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  summary?: ValidationSummary;
};

type ResolutionIssueGroup = {
  code: string;
  level: "warning" | "error";
  count: number;
  rowNumbers: number[];
};

type ResolutionRowItem = {
  rowNumber: number;
  validationLevel: "pending" | "valid" | "warning" | "error";
  issues: Array<{
    code: string;
    level: "warning" | "error";
    message: string;
    field: string | null;
  }>;
  excludedFromDownstream: boolean;
  resolutionStatus: string;
  resolutionNotes: string | null;
  accountId: string | null;
  accountNumber: string | null;
  commissionAmount: number | null;
  commissionDate: string | null;
  volume: number | null;
  symbol: string | null;
  currency: string | null;
  accountType: string | null;
  resolvedAccountId: string | null;
  resolvedTraderUserId: string | null;
};

type ResolutionSnapshot = {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  excludedRows: number;
  resolvedRows: number;
  groups: ResolutionIssueGroup[];
  rows: ResolutionRowItem[];
};

type ResolutionLoadActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  snapshot?: ResolutionSnapshot;
};

type ResolutionSaveActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  rowNumber?: number;
};

type SimulationSummary = {
  totalRows: number;
  mappedRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  resolvedRows: number;
  eligibleRows: number;
  blockedRows: number;
  excludedRows: number;
  estimatedGrossCommission: number;
  estimatedPlatformTotal: number;
  estimatedL2Total: number;
  estimatedTraderTotal: number;
  estimatedL1Total: number;
  simulationBasisVersion: string;
  nextRequiredAction: string;
  topBlockers: ValidationCategoryCount[];
};

type SimulationActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  summary?: SimulationSummary;
};

const INITIAL_UPLOAD_STATE: UploadActionState = {};
const INITIAL_MAPPING_STATE: MappingActionState = {};
const INITIAL_VALIDATION_STATE: ValidationActionState = {};
const INITIAL_RESOLUTION_LOAD_STATE: ResolutionLoadActionState = {};
const INITIAL_RESOLUTION_SAVE_STATE: ResolutionSaveActionState = {};
const INITIAL_SIMULATION_STATE: SimulationActionState = {};
const WORKFLOW_SECTION_IDS = {
  upload: "commission-upload-step-upload",
  mapping: "commission-upload-step-mapping",
  validation: "commission-upload-step-validation",
  resolution: "commission-upload-step-resolution",
  simulation: "commission-upload-step-simulation",
} as const;

function normalizeHeaderKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatIssueCodeLabel(code: string) {
  if (!code.trim()) {
    return "-";
  }

  return code
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ");
}

function buildSuggestedMapping(sourceColumns: string[]): CommissionUploadMapping {
  const normalized = sourceColumns.map((column) => ({
    source: column,
    normalized: normalizeHeaderKey(column),
  }));

  const findFirst = (patterns: RegExp[]) =>
    normalized.find((entry) => patterns.some((pattern) => pattern.test(entry.normalized)))?.source;

  return {
    account_number: findFirst([
      /accountnumber/,
      /accountlogin/,
      /account$/,
      /login$/,
      /mt\d*account/,
    ]),
    account_id: findFirst([/accountid/, /tradingaccountid/]),
    commission_amount: findFirst([/commissionamount/, /grosscommission/, /commission$/]),
    commission_date: findFirst([/commissiondate/, /date/, /tradetime/, /settledat/]),
    volume: findFirst([/volume/, /lot/, /lotsize/]),
    symbol: findFirst([/symbol/, /instrument/, /product/]),
    currency: findFirst([/currency/, /ccy/]),
    account_type: findFirst([/accounttype/, /accountgroup/, /group/]),
  };
}

function getMappingTemplateById(
  templates: UploadTemplateOption[],
  templateId: string
) {
  return templates.find((template) => template.template_id === templateId) ?? null;
}

function getDefaultTemplate(templates: UploadTemplateOption[]) {
  return templates.find((template) => template.is_default) ?? templates[0] ?? null;
}

export function CsvUploadForm({ brokerOptions }: { brokerOptions: string[] }) {
  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    uploadCommissionCsv,
    INITIAL_UPLOAD_STATE
  );
  const [mappingState, mappingFormAction, mappingPending] = useActionState(
    applyCommissionMappingTemplateAction,
    INITIAL_MAPPING_STATE
  );
  const [validationState, validationFormAction, validationPending] = useActionState(
    runCommissionBatchValidationAction,
    INITIAL_VALIDATION_STATE
  );
  const [resolutionLoadState, resolutionLoadFormAction, resolutionLoadPending] = useActionState(
    loadCommissionBatchResolutionAction,
    INITIAL_RESOLUTION_LOAD_STATE
  );
  const [resolutionSaveState, resolutionSaveFormAction, resolutionSavePending] = useActionState(
    saveCommissionStagingResolutionAction,
    INITIAL_RESOLUTION_SAVE_STATE
  );
  const [resolutionBulkState, resolutionBulkFormAction, resolutionBulkPending] = useActionState(
    applyCommissionResolutionBulkAction,
    INITIAL_RESOLUTION_SAVE_STATE
  );
  const [simulationState, simulationFormAction, simulationPending] = useActionState(
    runCommissionBatchSimulationAction,
    INITIAL_SIMULATION_STATE
  );

  const [broker, setBroker] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [mappingDraft, setMappingDraft] = useState<CommissionUploadMapping>({});
  const [templateName, setTemplateName] = useState("");
  const [saveTemplate, setSaveTemplate] = useState(true);
  const [setDefaultTemplate, setSetDefaultTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedBatchRef = useRef<string | null>(null);

  const activeBatchId = uploadState.batchId;
  const sourceColumns = uploadState.sourceColumns ?? [];
  const availableTemplates = useMemo(
    () => uploadState.availableTemplates ?? [],
    [uploadState.availableTemplates]
  );
  const templateOptions = useMemo(
    () => availableTemplates.filter((template) => template.broker === broker || !broker),
    [availableTemplates, broker]
  );

  useEffect(() => {
    if (!uploadState.batchId || uploadState.batchId === initializedBatchRef.current) {
      return;
    }

    initializedBatchRef.current = uploadState.batchId;

    const defaultTemplate = getDefaultTemplate(availableTemplates);
    const fallbackMapping = buildSuggestedMapping(uploadState.sourceColumns ?? []);
    const initialMapping = defaultTemplate?.mappings ?? fallbackMapping;

    setMappingDraft(initialMapping);
    setSelectedTemplateId(defaultTemplate?.template_id ?? "");
    setTemplateName(
      defaultTemplate?.template_name ?? `${broker || "broker"}-default-template`
    );
    setSetDefaultTemplate(Boolean(defaultTemplate?.is_default));
  }, [uploadState.batchId, uploadState.sourceColumns, availableTemplates, broker]);

  const mappingValidation = useMemo(() => {
    const missingRequired = REQUIRED_MAPPING_FIELDS.filter(
      (field) => !String(mappingDraft[field] ?? "").trim()
    );
    const hasAccountIdentifier = ACCOUNT_IDENTIFIER_MAPPING_FIELDS.some((field) =>
      Boolean(String(mappingDraft[field] ?? "").trim())
    );

    if (!hasAccountIdentifier) {
      missingRequired.push("account_number");
    }

    return {
      isReady: missingRequired.length === 0,
      missingRequired,
    };
  }, [mappingDraft]);

  const canSubmitUpload = Boolean(broker.trim()) && !uploadPending;
  const canSubmitMapping =
    Boolean(activeBatchId) &&
    Boolean(broker.trim()) &&
    sourceColumns.length > 0 &&
    mappingValidation.isReady &&
    !mappingPending;
  const canRunValidation = Boolean(activeBatchId) && sourceColumns.length > 0 && !validationPending;
  const canLoadResolution = Boolean(activeBatchId) && !resolutionLoadPending;
  const canRunSimulation = Boolean(activeBatchId) && !simulationPending;

  const selectedTemplate = getMappingTemplateById(templateOptions, selectedTemplateId);
  const appliedTemplateLabel = useMemo(() => {
    if (mappingState.templateId) {
      const matched = getMappingTemplateById(templateOptions, mappingState.templateId);
      return matched?.template_name ?? mappingState.templateId;
    }

    return selectedTemplate?.template_name ?? "Pending";
  }, [mappingState.templateId, templateOptions, selectedTemplate]);
  const workflowSummary = useMemo(() => {
    if (!activeBatchId) {
      return null;
    }

    const mappedRows = mappingState.mappedRows ?? 0;
    const validRows = validationState.summary?.validRows ?? 0;
    const warningRows = validationState.summary?.warningRows ?? 0;
    const errorRows = validationState.summary?.errorRows ?? 0;
    const excludedRows =
      resolutionLoadState.snapshot?.excludedRows ??
      validationState.summary?.excludedRows ??
      simulationState.summary?.excludedRows ??
      0;
    const resolvedRows = resolutionLoadState.snapshot?.resolvedRows ?? simulationState.summary?.resolvedRows ?? 0;
    const simulationEligibleRows =
      simulationState.summary?.eligibleRows ?? Math.max(validRows + warningRows - excludedRows, 0);
    const blockedRows = simulationState.summary?.blockedRows ?? errorRows;

    const currentStep = !mappingState.success
      ? "Mapping"
      : !validationState.summary
      ? "Validation"
      : !resolutionLoadState.snapshot
      ? "Resolution"
      : !simulationState.summary
      ? "Simulation"
      : blockedRows > 0
      ? "Resolution"
      : "Approval Gate";
    const nextAction =
      blockedRows > 0
        ? "Resolve blockers and rerun validation/simulation"
        : simulationState.summary
        ? "Proceed to approval gate"
        : "Run simulation";

    return {
      mappedRows,
      validRows,
      warningRows,
      errorRows,
      resolvedRows,
      excludedRows,
      simulationEligibleRows,
      blockedRows,
      currentStep,
      nextAction,
    };
  }, [
    activeBatchId,
    mappingState.mappedRows,
    mappingState.success,
    resolutionLoadState.snapshot,
    simulationState.summary,
    validationState.summary,
  ]);
  const validationHref = activeBatchId
    ? `/admin/commission?show_all=1&detail_batch_id=${encodeURIComponent(
        activeBatchId
      )}&batch_drawer=overview`
    : "/admin/commission";
  const duplicateBatchHref = uploadState.duplicateBatchId
    ? `/admin/commission?show_all=1&detail_batch_id=${encodeURIComponent(
        uploadState.duplicateBatchId
      )}&batch_drawer=overview`
    : null;
  const activeBatchQueueHref = activeBatchId
    ? `/admin/commission?show_all=1&detail_batch_id=${encodeURIComponent(
        activeBatchId
      )}&batch_drawer=overview`
    : "/admin/commission";
  const simulationReadyForApproval = (simulationState.summary?.blockedRows ?? 1) === 0;
  const currentStepSectionId = useMemo(() => {
    if (!workflowSummary) {
      return WORKFLOW_SECTION_IDS.upload;
    }

    if (workflowSummary.currentStep === "Mapping") {
      return WORKFLOW_SECTION_IDS.mapping;
    }

    if (workflowSummary.currentStep === "Validation") {
      return WORKFLOW_SECTION_IDS.validation;
    }

    if (workflowSummary.currentStep === "Resolution") {
      return WORKFLOW_SECTION_IDS.resolution;
    }

    if (workflowSummary.currentStep === "Simulation") {
      return WORKFLOW_SECTION_IDS.simulation;
    }

    return WORKFLOW_SECTION_IDS.simulation;
  }, [workflowSummary]);

  function scrollToWorkflowSection(sectionId: string) {
    if (typeof document === "undefined") {
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function onTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = getMappingTemplateById(templateOptions, templateId);

    if (!template) {
      return;
    }

    setMappingDraft(template.mappings);
    setTemplateName(template.template_name);
    setSetDefaultTemplate(Boolean(template.is_default));
  }

  function updateMappingField(field: CommissionCanonicalField, value: string) {
    setMappingDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearUploadForm() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (uploadState.success) {
      clearUploadForm();
    }
  }, [uploadState.success]);

  useEffect(() => {
    if (!uploadState.success || !activeBatchId) {
      return;
    }

    scrollToWorkflowSection(WORKFLOW_SECTION_IDS.mapping);
  }, [uploadState.success, activeBatchId]);

  useEffect(() => {
    if (!mappingState.success || !activeBatchId) {
      return;
    }

    scrollToWorkflowSection(WORKFLOW_SECTION_IDS.validation);
  }, [mappingState.success, activeBatchId]);

  useEffect(() => {
    if (!validationState.success || !activeBatchId) {
      return;
    }

    scrollToWorkflowSection(WORKFLOW_SECTION_IDS.resolution);
  }, [validationState.success, activeBatchId]);

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <div id={WORKFLOW_SECTION_IDS.upload}>
        <h2 className="text-base font-semibold text-white">Step 1: Upload File Into Staging</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Upload broker file into staging context first. Mapping and validation happen in separate guarded steps.
        </p>
      </div>

      <form action={uploadFormAction} className="space-y-4">
        <div>
          <label
            htmlFor="broker"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Broker
          </label>
          <input
            id="broker"
            name="broker"
            list="broker-options"
            value={broker}
            onChange={(event) => setBroker(event.target.value)}
            placeholder="Select or type broker name"
            className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
          <datalist id="broker-options">
            {brokerOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        <div>
          <label
            htmlFor="commission_file"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Commission File
          </label>
          <input
            ref={fileInputRef}
            id="commission_file"
            name="commission_file"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-zinc-200"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Supports CSV, XLSX, and XLS. File fingerprinting is enabled to prevent duplicate re-upload.
          </p>
        </div>

        {uploadState.error ? (
          <div className="space-y-2" aria-live="polite">
            <p className="text-sm text-rose-300">{uploadState.error}</p>
            {duplicateBatchHref ? (
              <Link href={duplicateBatchHref} className="inline-flex text-xs text-rose-200 underline">
                Open existing batch
              </Link>
            ) : null}
          </div>
        ) : null}
        {uploadState.success ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <p>{uploadState.success}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmitUpload}
          className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadPending ? "Uploading..." : "Upload File"}
        </button>
      </form>

      {activeBatchId ? (
        <div className="grid gap-3 rounded-2xl bg-white/[0.03] p-4 md:grid-cols-5">
          <Metric label="Batch ID" value={activeBatchId} mono />
          <Metric label="Uploaded File" value={uploadState.uploadedFileName ?? "-"} />
          <Metric label="Row Count" value={String(uploadState.rowCount ?? 0)} />
          <Metric label="Template Used" value={appliedTemplateLabel} />
          <Metric
            label="Mapping Status"
            value={mappingState.mappingStatus ?? "pending"}
            className="capitalize"
          />
        </div>
      ) : null}

      {activeBatchId ? (
        <WorkflowStepNavigator
          canShowMapping={sourceColumns.length > 0}
          canShowValidation={Boolean(activeBatchId)}
          canShowResolution={Boolean(activeBatchId)}
          canShowSimulation={Boolean(activeBatchId)}
          currentStep={workflowSummary?.currentStep ?? "Mapping"}
          onScrollToUpload={() => scrollToWorkflowSection(WORKFLOW_SECTION_IDS.upload)}
          onScrollToMapping={() => scrollToWorkflowSection(WORKFLOW_SECTION_IDS.mapping)}
          onScrollToValidation={() => scrollToWorkflowSection(WORKFLOW_SECTION_IDS.validation)}
          onScrollToResolution={() => scrollToWorkflowSection(WORKFLOW_SECTION_IDS.resolution)}
          onScrollToSimulation={() => scrollToWorkflowSection(WORKFLOW_SECTION_IDS.simulation)}
          onScrollToCurrentStep={() => scrollToWorkflowSection(currentStepSectionId)}
        />
      ) : null}

      {workflowSummary ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Workflow Snapshot
            </p>
            <p className="text-xs text-zinc-300">
              Current Step: <span className="font-medium text-white">{workflowSummary.currentStep}</span>
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            <Metric label="Mapped Rows" value={String(workflowSummary.mappedRows)} />
            <Metric label="Valid Rows" value={String(workflowSummary.validRows)} />
            <Metric label="Warning Rows" value={String(workflowSummary.warningRows)} />
            <Metric label="Error Rows" value={String(workflowSummary.errorRows)} />
            <Metric label="Resolved Rows" value={String(workflowSummary.resolvedRows)} />
            <Metric label="Excluded Rows" value={String(workflowSummary.excludedRows)} />
            <Metric
              label="Simulation Eligible"
              value={String(workflowSummary.simulationEligibleRows)}
            />
            <Metric label="Blocked Rows" value={String(workflowSummary.blockedRows)} />
          </div>
          <p className="text-xs text-zinc-400">Next Action: {workflowSummary.nextAction}</p>
        </div>
      ) : null}

      {activeBatchId && sourceColumns.length > 0 ? (
        <div
          id={WORKFLOW_SECTION_IDS.mapping}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div>
            <h3 className="text-sm font-semibold text-white">Step 2: Template Mapping</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Map source columns to canonical commission fields. Required mappings are enforced before validation.
            </p>
          </div>

          {templateOptions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Load Saved Template
                </span>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => onTemplateChange(event.target.value)}
                  className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
                >
                  <option value="">Select template</option>
                  {templateOptions.map((template) => (
                    <option key={template.template_id} value={template.template_id}>
                      {template.template_name}
                      {template.is_default ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-zinc-400">
                <p>Template reuse is broker-scoped. You can adjust and save a new template after mapping.</p>
                {selectedTemplate ? (
                  <p className="mt-1 text-zinc-300">Loaded: {selectedTemplate.template_name}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              No saved template for this broker yet. Map columns manually and save as template.
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Internal Field
                  </th>
                  <th className="px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Required
                  </th>
                  <th className="px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Source Column
                  </th>
                  <th className="px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION_CANONICAL_FIELDS.map((field) => {
                  const selectedValue = mappingDraft[field.key] ?? "";
                  const isBrokerField = field.key === "broker";
                  return (
                    <tr key={field.key} className="border-b border-white/5">
                      <td className="px-3 py-2 text-zinc-100">{field.label}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${
                            field.required
                              ? "bg-amber-500/15 text-amber-200"
                              : "bg-white/[0.08] text-zinc-300"
                          }`}
                        >
                          {field.required ? "Required" : "Optional"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {isBrokerField ? (
                          <input
                            value={broker}
                            readOnly
                            className="admin-control h-9 w-full rounded-lg px-3 text-xs text-zinc-300 outline-none"
                          />
                        ) : (
                          <select
                            value={selectedValue}
                            onChange={(event) => updateMappingField(field.key, event.target.value)}
                            className="admin-control h-9 w-full rounded-lg px-3 text-xs text-zinc-200 outline-none"
                          >
                            <option value="">Not mapped</option>
                            {sourceColumns.map((column) => (
                              <option key={`${field.key}-${column}`} value={column}>
                                {column}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-400">{field.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!mappingValidation.isReady ? (
            <p className="text-xs text-amber-300">
              Missing required mapping: {mappingValidation.missingRequired.join(", ")}.
            </p>
          ) : (
            <p className="text-xs text-emerald-300">Required mapping complete. Ready for validation step.</p>
          )}

          <form action={mappingFormAction} className="space-y-3">
            <input type="hidden" name="batch_id" value={activeBatchId} />
            <input type="hidden" name="broker" value={broker} />
            <input type="hidden" name="template_id" value={selectedTemplateId} />
            <input type="hidden" name="mapping_json" value={JSON.stringify(mappingDraft)} />
            <input type="hidden" name="save_template" value={String(saveTemplate)} />
            <input type="hidden" name="set_default_template" value={String(setDefaultTemplate)} />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Template Name
                </span>
                <input
                  name="template_name"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
                />
              </label>
              <div className="flex items-center gap-4 pt-6 text-xs text-zinc-300">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={saveTemplate}
                    onChange={(event) => setSaveTemplate(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Save template
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={setDefaultTemplate}
                    onChange={(event) => setSetDefaultTemplate(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                    disabled={!saveTemplate}
                  />
                  Set as default
                </label>
              </div>
            </div>

            {mappingState.error ? (
              <p className="text-sm text-rose-300" aria-live="polite">
                {mappingState.error}
              </p>
            ) : null}
            {mappingState.success ? (
              <p className="text-sm text-emerald-300" aria-live="polite">
                {mappingState.success}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canSubmitMapping}
                className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mappingPending ? "Applying Mapping..." : "Apply Mapping"}
              </button>
              <Link href={validationHref} className="text-xs text-zinc-400 underline">
                Open batch for validation
              </Link>
            </div>
          </form>
        </div>
      ) : null}

      {activeBatchId ? (
        <div
          id={WORKFLOW_SECTION_IDS.validation}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div>
            <h3 className="text-sm font-semibold text-white">Step 3: Validation</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Validate staged rows before resolution/simulation. This step does not approve or settle
              funds.
            </p>
          </div>

          <form action={validationFormAction} className="space-y-3">
            <input type="hidden" name="batch_id" value={activeBatchId} />
            <button
              type="submit"
              disabled={!canRunValidation}
              className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {validationPending ? "Running Validation..." : "Run Validation"}
            </button>
          </form>

          {validationState.error ? (
            <p className="text-sm text-rose-300" aria-live="polite">
              {validationState.error}
            </p>
          ) : null}
          {validationState.success ? (
            <p className="text-sm text-emerald-300" aria-live="polite">
              {validationState.success}
            </p>
          ) : null}

          {validationState.summary ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-6">
                <Metric label="Total Rows" value={String(validationState.summary.totalRows)} />
                <Metric label="Valid Rows" value={String(validationState.summary.validRows)} />
                <Metric label="Warning Rows" value={String(validationState.summary.warningRows)} />
                <Metric label="Error Rows" value={String(validationState.summary.errorRows)} />
                <Metric label="Excluded Rows" value={String(validationState.summary.excludedRows ?? 0)} />
                <Metric label="Duplicate Rows" value={String(validationState.summary.duplicateRows)} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Top Error Categories
                  </p>
                  {validationState.summary.topErrorCategories.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                      {validationState.summary.topErrorCategories.map((category) => (
                        <li key={`error-${category.code}`} className="flex justify-between gap-3">
                          <span>{category.code}</span>
                          <span>{category.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">No error categories.</p>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Top Warning Categories
                  </p>
                  {validationState.summary.topWarningCategories.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                      {validationState.summary.topWarningCategories.map((category) => (
                        <li key={`warning-${category.code}`} className="flex justify-between gap-3">
                          <span>{category.code}</span>
                          <span>{category.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">No warning categories.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeBatchId ? (
        <div
          id={WORKFLOW_SECTION_IDS.resolution}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div>
            <h3 className="text-sm font-semibold text-white">Step 4: Resolution</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Resolve grouped validation issues on staging rows only. Raw source rows remain immutable for
              traceability.
            </p>
          </div>

          <form action={resolutionLoadFormAction}>
            <input type="hidden" name="batch_id" value={activeBatchId} />
            <button
              type="submit"
              disabled={!canLoadResolution}
              className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resolutionLoadPending ? "Loading..." : "Load Resolution Issues"}
            </button>
          </form>

          {resolutionLoadState.error ? (
            <p className="text-sm text-rose-300" aria-live="polite">
              {resolutionLoadState.error}
            </p>
          ) : null}
          {resolutionLoadState.success ? (
            <p className="text-sm text-emerald-300" aria-live="polite">
              {resolutionLoadState.success}
            </p>
          ) : null}

          {resolutionLoadState.snapshot ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-6">
                <Metric label="Total Rows" value={String(resolutionLoadState.snapshot.totalRows)} />
                <Metric label="Valid Rows" value={String(resolutionLoadState.snapshot.validRows)} />
                <Metric label="Warning Rows" value={String(resolutionLoadState.snapshot.warningRows)} />
                <Metric label="Error Rows" value={String(resolutionLoadState.snapshot.errorRows)} />
                <Metric label="Resolved Rows" value={String(resolutionLoadState.snapshot.resolvedRows)} />
                <Metric label="Excluded Rows" value={String(resolutionLoadState.snapshot.excludedRows)} />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Issue Groups
                </p>
                {resolutionLoadState.snapshot.groups.length > 0 ? (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {resolutionLoadState.snapshot.groups.map((group) => (
                      <div
                        key={`issue-group-${group.code}`}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div>
                          <p className="text-xs text-zinc-200">{formatIssueCodeLabel(group.code)}</p>
                          <p className="text-[10px] text-zinc-500">Rows: {group.rowNumbers.join(", ")}</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${
                            group.level === "error"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {group.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">No grouped issues found.</p>
                )}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <form action={resolutionSaveFormAction} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <input type="hidden" name="batch_id" value={activeBatchId} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Row-Level Fix
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input name="row_number" placeholder="Row number" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="resolved_account_id" placeholder="Resolved account_id (optional)" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="account_id" placeholder="account_id" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="account_number" placeholder="account_number" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="commission_amount" placeholder="commission_amount" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="commission_date" placeholder="commission_date (ISO or parseable)" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="volume" placeholder="volume" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="symbol" placeholder="symbol" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="currency" placeholder="currency" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                    <input name="account_type" placeholder="account_type" className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <input
                      name="resolution_notes"
                      placeholder="resolution notes"
                      className="admin-control h-9 rounded-lg px-3 text-xs text-zinc-200 outline-none"
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        name="excluded_from_downstream"
                        value="true"
                        className="h-4 w-4 rounded border-white/20 bg-transparent"
                      />
                      Exclude
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={resolutionSavePending}
                    className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resolutionSavePending ? "Saving..." : "Save Row Fix"}
                  </button>
                </form>

                <form action={resolutionBulkFormAction} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <input type="hidden" name="batch_id" value={activeBatchId} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Bulk Resolution
                  </p>
                  <select
                    name="issue_code"
                    className="admin-control h-9 w-full rounded-lg px-3 text-xs text-zinc-200 outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select issue code
                    </option>
                    {resolutionLoadState.snapshot.groups.map((group) => (
                      <option key={`bulk-${group.code}`} value={group.code}>
                        {group.code} ({group.count})
                      </option>
                    ))}
                  </select>
                  <select
                    name="bulk_action"
                    className="admin-control h-9 w-full rounded-lg px-3 text-xs text-zinc-200 outline-none"
                    defaultValue="exclude"
                  >
                    <option value="exclude">Exclude all rows in issue group</option>
                    <option value="set_resolved_account">Set resolved account_id for issue group</option>
                  </select>
                  <input
                    name="resolved_account_id"
                    placeholder="resolved_account_id (for set_resolved_account)"
                    className="admin-control h-9 w-full rounded-lg px-3 text-xs text-zinc-200 outline-none"
                  />
                  <input
                    name="resolution_notes"
                    placeholder="bulk resolution notes"
                    className="admin-control h-9 w-full rounded-lg px-3 text-xs text-zinc-200 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={resolutionBulkPending}
                    className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resolutionBulkPending ? "Applying..." : "Apply Bulk Action"}
                  </button>
                </form>
              </div>

              {resolutionSaveState.error ? (
                <p className="text-sm text-rose-300">{resolutionSaveState.error}</p>
              ) : null}
              {resolutionSaveState.success ? (
                <p className="text-sm text-emerald-300">{resolutionSaveState.success}</p>
              ) : null}
              {resolutionBulkState.error ? (
                <p className="text-sm text-rose-300">{resolutionBulkState.error}</p>
              ) : null}
              {resolutionBulkState.success ? (
                <p className="text-sm text-emerald-300">{resolutionBulkState.success}</p>
              ) : null}

              <p className="text-xs text-zinc-500">
                After row/bulk fixes, rerun Validation to recompute warning/error states. Manual resolution
                does not directly flip validation status.
              </p>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.03]">
                    <tr>
                      <th className="px-3 py-2 text-zinc-400">Row</th>
                      <th className="px-3 py-2 text-zinc-400">Level</th>
                      <th className="px-3 py-2 text-zinc-400">Issues</th>
                      <th className="px-3 py-2 text-zinc-400">Account</th>
                      <th className="px-3 py-2 text-zinc-400">Amount</th>
                      <th className="px-3 py-2 text-zinc-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolutionLoadState.snapshot.rows.slice(0, 80).map((row) => (
                      <tr key={`resolution-row-${row.rowNumber}`} className="border-b border-white/5">
                        <td className="px-3 py-2 text-zinc-300">{row.rowNumber}</td>
                        <td className="px-3 py-2 capitalize text-zinc-300">{row.validationLevel}</td>
                        <td className="px-3 py-2 text-zinc-300">
                          {row.issues.map((issue) => formatIssueCodeLabel(issue.code)).join(", ") || "-"}
                        </td>
                        <td className="px-3 py-2 text-zinc-300">{row.accountNumber ?? row.accountId ?? "-"}</td>
                        <td className="px-3 py-2 text-zinc-300">{row.commissionAmount ?? "-"}</td>
                        <td className="px-3 py-2 text-zinc-300">{row.commissionDate ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeBatchId ? (
        <div
          id={WORKFLOW_SECTION_IDS.simulation}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div>
            <h3 className="text-sm font-semibold text-white">Step 5: Simulation</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Run backend simulation preview on eligible staging rows. This step writes no live settlement
              ledger entries.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Eligibility rule: mapped + (valid or warning) + not excluded. Error rows remain blockers.
            </p>
          </div>

          <form action={simulationFormAction}>
            <input type="hidden" name="batch_id" value={activeBatchId} />
            <button
              type="submit"
              disabled={!canRunSimulation}
              className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {simulationPending ? "Running Simulation..." : "Run Simulation"}
            </button>
          </form>

          {simulationState.error ? (
            <p className="text-sm text-rose-300">{simulationState.error}</p>
          ) : null}
          {simulationState.success ? (
            <p className="text-sm text-emerald-300">{simulationState.success}</p>
          ) : null}

          {simulationState.summary ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-5">
                <Metric label="Total Rows" value={String(simulationState.summary.totalRows)} />
                <Metric label="Mapped Rows" value={String(simulationState.summary.mappedRows)} />
                <Metric label="Eligible Rows" value={String(simulationState.summary.eligibleRows)} />
                <Metric label="Blocked Rows" value={String(simulationState.summary.blockedRows)} />
                <Metric label="Excluded Rows" value={String(simulationState.summary.excludedRows)} />
                <Metric label="Resolved Rows" value={String(simulationState.summary.resolvedRows)} />
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Metric label="Valid Rows" value={String(simulationState.summary.validRows)} />
                <Metric label="Warning Rows" value={String(simulationState.summary.warningRows)} />
                <Metric label="Error Rows" value={String(simulationState.summary.errorRows)} />
                <Metric
                  label="Estimated Gross"
                  value={String(simulationState.summary.estimatedGrossCommission)}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Metric label="Platform Total" value={String(simulationState.summary.estimatedPlatformTotal)} />
                <Metric label="L2 Total" value={String(simulationState.summary.estimatedL2Total)} />
                <Metric label="Trader Total" value={String(simulationState.summary.estimatedTraderTotal)} />
                <Metric label="L1 Total" value={String(simulationState.summary.estimatedL1Total)} />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-zinc-300">
                  Basis:{" "}
                  <span className="font-medium text-zinc-100">
                    {simulationState.summary.simulationBasisVersion}
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Next Required Action: {simulationState.summary.nextRequiredAction}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Preview only. Simulation never writes live settlement entries into finance_ledger.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Top Blockers
                </p>
                {simulationState.summary.topBlockers.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                      {simulationState.summary.topBlockers.map((blocker) => (
                        <li key={`sim-blocker-${blocker.code}`} className="flex justify-between gap-3">
                          <span>{formatIssueCodeLabel(blocker.code)}</span>
                          <span>{blocker.count}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">No blockers.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeBatchId ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Step 6: Approval Handoff</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Approval is executed in the commission queue drawer. Use handoff links below to continue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={activeBatchQueueHref}
              className="admin-interactive inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200"
            >
              Open Current Batch In Queue
            </Link>
            <Link
              href="/admin/commission/batches"
              className="admin-interactive inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300"
            >
              Open Batch List
            </Link>
          </div>
          {simulationState.summary ? (
            <p
              className={`text-xs ${
                simulationReadyForApproval ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {simulationReadyForApproval
                ? "Simulation passed with no blockers. Batch can proceed to approval gate checks."
                : "Simulation still has blockers. Resolve and rerun before approval."}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              Run simulation first to confirm downstream readiness before approval handoff.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function WorkflowStepNavigator({
  canShowMapping,
  canShowValidation,
  canShowResolution,
  canShowSimulation,
  currentStep,
  onScrollToUpload,
  onScrollToMapping,
  onScrollToValidation,
  onScrollToResolution,
  onScrollToSimulation,
  onScrollToCurrentStep,
}: {
  canShowMapping: boolean;
  canShowValidation: boolean;
  canShowResolution: boolean;
  canShowSimulation: boolean;
  currentStep: string;
  onScrollToUpload: () => void;
  onScrollToMapping: () => void;
  onScrollToValidation: () => void;
  onScrollToResolution: () => void;
  onScrollToSimulation: () => void;
  onScrollToCurrentStep: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-sky-300/20 bg-sky-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
          Next Step Navigation
        </p>
        <button
          type="button"
          onClick={onScrollToCurrentStep}
          className="admin-interactive rounded-lg border border-sky-300/30 bg-sky-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-100"
        >
          Go To Current Step: {currentStep}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <StepNavButton label="Step 1 Upload" onClick={onScrollToUpload} enabled />
        <StepNavButton label="Step 2 Mapping" onClick={onScrollToMapping} enabled={canShowMapping} />
        <StepNavButton
          label="Step 3 Validation"
          onClick={onScrollToValidation}
          enabled={canShowValidation}
        />
        <StepNavButton
          label="Step 4 Resolution"
          onClick={onScrollToResolution}
          enabled={canShowResolution}
        />
        <StepNavButton
          label="Step 5 Simulation"
          onClick={onScrollToSimulation}
          enabled={canShowSimulation}
        />
      </div>
    </div>
  );
}

function StepNavButton({
  label,
  onClick,
  enabled,
}: {
  label: string;
  onClick: () => void;
  enabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className="admin-interactive rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function Metric({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`${mono ? "font-mono text-xs" : "text-sm"} text-zinc-200 ${className ?? ""}`}>{value}</p>
    </div>
  );
}
