import type {
  CommissionBatch,
  CommissionBatchIssueSummary,
  CommissionDecisionTone,
  CommissionOperationalPosture,
  CommissionPipelineStage,
  CommissionRecord,
  CommissionBatchSourceRow,
  CommissionWorkspaceTab,
  RebateRecord,
  SummaryMetric,
} from "./_types";

function matchesKeyword(values: Array<string | null | undefined>, keyword: string) {
  if (!keyword) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(keyword));
}

export function filterCommissionRecords(
  records: CommissionRecord[],
  filters: {
    query: string;
    broker: string;
    date_from: string;
    date_to: string;
  }
) {
  const keyword = filters.query.trim().toLowerCase();
  const broker = filters.broker.trim().toLowerCase();
  const dateFrom = filters.date_from ? new Date(`${filters.date_from}T00:00:00`).getTime() : null;
  const dateTo = filters.date_to ? new Date(`${filters.date_to}T23:59:59.999`).getTime() : null;

  return records.filter((record) => {
    const recordTime = new Date(record.settled_at || record.imported_at).getTime();
    const matchesText = matchesKeyword(
      [
        record.commission_id,
        record.batch_id,
        record.trader_user_id,
        record.trader_email,
        record.broker,
        record.account_id,
      ],
      keyword
    );
    const matchesBroker =
      !broker || record.broker.toLowerCase().includes(broker);
    const matchesDateFrom = dateFrom === null || recordTime >= dateFrom;
    const matchesDateTo = dateTo === null || recordTime <= dateTo;

    return matchesText && matchesBroker && matchesDateFrom && matchesDateTo;
  });
}

export function filterRebateRecords(records: RebateRecord[], query: string) {
  const keyword = query.trim().toLowerCase();

  return records.filter((record) =>
    matchesKeyword(
      [record.rebate_id, record.beneficiary, record.account_id, record.relationship_snapshot_id],
      keyword
    )
  );
}

export function filterRecordsByAccountId<T extends { account_id: string }>(
  records: T[],
  accountId: string
) {
  if (!accountId.trim()) {
    return records;
  }

  const normalized = accountId.trim().toLowerCase();

  return records.filter((record) => record.account_id.toLowerCase() === normalized);
}

export function getCommissionWorkspaceSummary(
  tab: CommissionWorkspaceTab,
  commissionRecords: CommissionRecord[],
  rebateRecords: RebateRecord[]
): SummaryMetric[] {
  if (tab === "inputs") {
    const totalCommission = commissionRecords.reduce((sum, row) => sum + row.gross_commission, 0);
    const importedCount = commissionRecords.filter((row) => row.status === "imported").length;
    const validatedCount = commissionRecords.filter((row) => row.status === "validated").length;
    const processedCount = commissionRecords.filter((row) => row.status === "processed").length;

    return [
      {
        label: "Total Commission",
        value: totalCommission,
        valueType: "currency",
        emphasis: "strong",
      },
      { label: "Imported", value: importedCount, valueType: "count" },
      { label: "Validated", value: validatedCount, valueType: "count" },
      { label: "Processed", value: processedCount, valueType: "count" },
    ];
  }

  if (tab === "allocation") {
    const totalGross = commissionRecords.reduce((sum, row) => sum + row.gross_commission, 0);
    const totalRebate = commissionRecords.reduce((sum, row) => sum + row.rebate_amount, 0);
    const totalPlatformShare = commissionRecords.reduce(
      (sum, row) => sum + row.platform_amount,
      0
    );

    return [
      {
        label: "Total Gross Commission",
        value: totalGross,
        valueType: "currency",
        emphasis: "strong",
      },
      { label: "Total Allocated Rebate", value: totalRebate, valueType: "currency" },
      { label: "Platform Share", value: totalPlatformShare, valueType: "currency" },
      { label: "Records", value: commissionRecords.length, valueType: "count" },
    ];
  }

  const totalPaid = rebateRecords
    .filter((row) => row.status === "posted")
    .reduce((sum, row) => sum + row.amount, 0);
  const pendingCount = rebateRecords.filter((row) => row.status === "pending").length;
  const settledCount = rebateRecords.filter((row) => row.status === "posted").length;

  return [
    {
      label: "Total Paid",
      value: totalPaid,
      valueType: "currency",
      emphasis: "strong",
      tone: "positive",
    },
    { label: "Pending", value: pendingCount, valueType: "count" },
    { label: "Settled", value: settledCount, valueType: "count" },
    { label: "Records", value: rebateRecords.length, valueType: "count" },
  ];
}

type CommissionWorkflowContext = {
  guardrailBlocked?: boolean;
  simulationCompleted?: boolean;
  simulationRequired?: boolean;
};

export function getCommissionBatchWorkflowState(batch: CommissionBatch) {
  return getCommissionBatchWorkflowStateWithContext(batch);
}

export function getCommissionBatchWorkflowStateWithContext(
  batch: CommissionBatch,
  context: CommissionWorkflowContext = {}
) {
  const needsReview =
    batch.failed_rows > 0 ||
    batch.validation_result !== "passed" ||
    batch.duplicate_result !== "clear" ||
    context.guardrailBlocked === true ||
    (context.simulationRequired === true && context.simulationCompleted === false);
  const isReadyForSettlement = batch.status === "validated" && !needsReview;
  const isSettled = batch.status === "confirmed" || batch.status === "locked";

  return {
    needsReview,
    isReadyForSettlement,
    isSettled,
  };
}

export function getCommissionDecisionLabel(batch: CommissionBatch) {
  return getCommissionDecisionLabelWithContext(batch);
}

export function getCommissionDecisionLabelWithContext(
  batch: CommissionBatch,
  context: CommissionWorkflowContext = {}
): {
  label: string;
  tone: CommissionDecisionTone;
} {
  const workflow = getCommissionBatchWorkflowStateWithContext(batch, context);

  if (batch.failed_rows > 0) {
    return {
      label: `${batch.failed_rows} Errors`,
      tone: "error",
    };
  }

  if (batch.validation_result !== "passed" || batch.duplicate_result !== "clear") {
    return {
      label: "Review Needed",
      tone: "review",
    };
  }

  if (context.guardrailBlocked) {
    return {
      label: "Review Needed",
      tone: "review",
    };
  }

  if (context.simulationRequired === true && context.simulationCompleted === false) {
    return {
      label: "Simulation Required",
      tone: "review",
    };
  }

  if (workflow.needsReview) {
    return {
      label: "Review Needed",
      tone: "review",
    };
  }

  if (workflow.isReadyForSettlement) {
    return {
      label: "Ready to Post",
      tone: "ready",
    };
  }

  if (workflow.isSettled) {
    return {
      label: "Finalized",
      tone: "finalized",
    };
  }

  return {
    label: "Review Needed",
    tone: "review",
  };
}

export function getCommissionProblemSummary(batch: CommissionBatch) {
  return getCommissionProblemSummaryWithContext(batch);
}

export function getCommissionProblemSummaryWithContext(
  batch: CommissionBatch,
  context: CommissionWorkflowContext = {}
) {
  const workflow = getCommissionBatchWorkflowStateWithContext(batch, context);

  if (batch.failed_rows > 0) {
    return `${batch.failed_rows} failed rows`;
  }

  if (batch.duplicate_result !== "clear") {
    return "Duplicate detected";
  }

  if (context.simulationRequired === true && context.simulationCompleted === false) {
    return "Simulation required";
  }

  if (context.guardrailBlocked) {
    return "Profit violation";
  }

  if (workflow.isReadyForSettlement) {
    return "Ready for approval";
  }

  if (workflow.isSettled) {
    return "Finalized";
  }

  if (batch.validation_result !== "passed") {
    return "Validation review";
  }

  return "Awaiting review";
}

export function getCommissionIssueSummary(
  rows: CommissionBatchSourceRow[]
): CommissionBatchIssueSummary {
  return {
    invalidRows: rows.filter((row) => row.result === "failed").length,
    duplicateRecords: rows.filter((row) => row.error?.toLowerCase().includes("duplicate"))
      .length,
    missingAccounts: rows.filter((row) =>
      /(missing user|missing account|missing.*mapping)/i.test(row.error ?? "")
    ).length,
  };
}

export function getCommissionQueuePriority(batch: CommissionBatch) {
  return getCommissionQueuePriorityWithContext(batch);
}

export function getCommissionQueuePriorityWithContext(
  batch: CommissionBatch,
  context: CommissionWorkflowContext = {}
) {
  const workflow = getCommissionBatchWorkflowStateWithContext(batch, context);

  if (batch.failed_rows > 0) {
    return 4000 + batch.failed_rows;
  }

  if (batch.duplicate_result !== "clear") {
    return 3000;
  }

  if (context.simulationRequired === true && context.simulationCompleted === false) {
    return 2800;
  }

  if (context.guardrailBlocked) {
    return 2500;
  }

  if (workflow.isReadyForSettlement) {
    return 2000;
  }

  if (workflow.isSettled) {
    return 0;
  }

  return 1000;
}

export function sortCommissionBatchesForQueue(batches: CommissionBatch[]) {
  return sortCommissionBatchesForQueueWithContext(batches);
}

export function sortCommissionBatchesForQueueWithContext(
  batches: CommissionBatch[],
  getContext?: (batch: CommissionBatch) => CommissionWorkflowContext
) {
  return [...batches].sort((a, b) => {
    const priorityDelta =
      getCommissionQueuePriorityWithContext(b, getContext?.(b)) -
      getCommissionQueuePriorityWithContext(a, getContext?.(a));

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime();
  });
}

export function getCommissionPipelineStages(
  batches: CommissionBatch[],
  commissionRecords: CommissionRecord[],
  rebateRecords: RebateRecord[]
): CommissionPipelineStage[] {
  const reviewedBatches = batches.filter(
    (batch) => getCommissionBatchWorkflowState(batch).needsReview
  ).length;
  const readyBatches = batches.filter(
    (batch) => getCommissionBatchWorkflowState(batch).isReadyForSettlement
  ).length;
  const settledBatches = batches.filter(
    (batch) => getCommissionBatchWorkflowState(batch).isSettled
  ).length;
  const validatedRecords = commissionRecords.filter((row) => row.status === "validated").length;
  const postedRebates = rebateRecords.filter((row) => row.status === "posted").length;

  return [
    {
      key: "upload",
      label: "Upload Source File",
      description:
        "Start the pipeline with broker CSV or XLSX source files before any validation or settlement work begins.",
      metricLabel: "Batch entry",
      metricValue: batches.length,
      href: "/admin/commission/upload",
    },
    {
      key: "validation",
      label: "Validation & Mapping",
      description:
        "Review required fields, mapping readiness, and duplicate risk before the batch is treated as safe to continue.",
      metricLabel: "Needs review",
      metricValue: reviewedBatches,
      href: "/admin/commission/batches",
    },
    {
      key: "simulation",
      label: "Simulation Preview",
      description:
        "Preview the waterfall and allocation outcome before treating the batch as operationally ready.",
      metricLabel: "Validated records",
      metricValue: validatedRecords,
      href: "/admin/commission/simulate",
    },
    {
      key: "batchReview",
      label: "Batch Review",
      description:
        "Move through batch-level review, confirmation, cancel, or rollback flow while the source context is still intact.",
      metricLabel: "Ready batches",
      metricValue: readyBatches,
      href: "/admin/commission/batches",
    },
    {
      key: "settlement",
      label: "Rebate Posting",
      description:
        "Track the downstream stage after review, where records are treated as settled and move toward rebate and finance visibility.",
      metricLabel: "Posted rebates",
      metricValue: postedRebates || settledBatches,
      href: "/admin/commission?tab=rebates",
    },
  ];
}

export function getCommissionUploadPosture(
  batches: CommissionBatch[]
): CommissionOperationalPosture {
  const reviewCount = batches.filter(
    (batch) => getCommissionBatchWorkflowState(batch).needsReview
  ).length;

  if (reviewCount > 0) {
    return {
      stageLabel: "Validation Review",
      nextAction:
        "Resolve failed rows, mapping gaps, or duplicate concerns before treating uploads as ready downstream inputs.",
      linkedModuleLabel: "Batch Management",
      reviewNote:
        "Upload is an intake surface only. Operational confidence comes from validation and review, not file submission itself.",
    };
  }

  return {
    stageLabel: "Upload Ready",
    nextAction:
      "Move validated inputs into simulation review or batch confirmation so the downstream rebate flow starts from clean source context.",
    linkedModuleLabel: "Simulation Preview",
    reviewNote:
      "Use upload to bring source files into the workspace, then shift quickly into review-oriented stages.",
  };
}

export function getCommissionSimulationPosture(): CommissionOperationalPosture {
  return {
    stageLabel: "Simulation Review",
    nextAction:
      "Review waterfall behavior and downstream distribution assumptions before any confirmed batch is treated as operationally ready.",
    linkedModuleLabel: "Batch Management",
    reviewNote:
      "Simulation is intentionally read-only. It should explain expected outcomes, not post commission, rebate, or finance records.",
  };
}

export function getCommissionBatchManagementPosture(
  batches: CommissionBatch[]
): CommissionOperationalPosture {
  const reviewCount = batches.filter(
    (batch) => getCommissionBatchWorkflowState(batch).needsReview
  ).length;

  if (reviewCount > 0) {
    return {
      stageLabel: "Review Queue",
      nextAction:
        "Work through validation failures, duplicate concerns, and source-level discrepancies before confirming any affected batch.",
      linkedModuleLabel: "Batch Detail",
      reviewNote:
        "Batch management is the decision gate of the commission pipeline. It should stay focused on review confidence, not raw upload intake.",
    };
  }

  return {
    stageLabel: "Confirmation Queue",
    nextAction:
      "Move clean, validated batches through approval and posting once review evidence is complete and downstream posting order is understood.",
    linkedModuleLabel: "Approve & Post",
    reviewNote:
      "Use this page to manage readiness, confirmation, cancel, rollback, and export posture before records are treated as settled.",
  };
}

export function getCommissionBatchDetailPosture(
  batch: CommissionBatch
): CommissionOperationalPosture {
  const workflowState = getCommissionBatchWorkflowState(batch);

  if (workflowState.isSettled) {
    return {
      stageLabel: "Posted Batch",
      nextAction:
        "Use export and downstream finance visibility as verification surfaces rather than reopening the batch workflow.",
      linkedModuleLabel: "Finance / Rebates",
      reviewNote:
        "This batch has already crossed the operational decision point and should now be treated as a downstream visibility item.",
    };
  }

  if (workflowState.needsReview) {
    return {
      stageLabel: "Validation Review",
      nextAction:
        "Resolve failed rows, duplicate concerns, and mapping exceptions before allowing approval to proceed.",
      linkedModuleLabel: "Validation Summary",
      reviewNote:
        "Export remains a support action here. The primary responsibility of this detail page is review, not downstream execution.",
    };
  }

  return {
    stageLabel: "Approval Ready",
    nextAction:
      "Confirm the batch only after review evidence, expected posting impact, and rollback implications are clearly understood.",
    linkedModuleLabel: "Approve & Post",
    reviewNote:
      "A clean batch still needs an operational decision. Treat approval as a guarded transition into rebate and ledger visibility.",
  };
}
