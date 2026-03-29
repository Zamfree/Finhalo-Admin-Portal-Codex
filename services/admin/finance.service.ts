import {
  MOCK_ADJUSTMENTS,
  MOCK_FINANCE_HUB_DATA,
  MOCK_LEDGER_ROWS,
  MOCK_RECONCILIATION_ROWS,
  MOCK_WITHDRAWALS,
} from "@/app/admin/finance/_mock-data";
import type {
  AdjustmentRow,
  FinanceHubData,
  LedgerRow,
  LedgerTransactionType,
  LedgerViewerFilters,
  LedgerViewerPage,
  ReconciliationRow,
  WithdrawalEventRow,
  WithdrawalLinkedLedgerRow,
  WithdrawalRow,
} from "@/app/admin/finance/_types";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;
const LEDGER_VIEWER_DEFAULT_PAGE_SIZE = 25;
const LEDGER_VIEWER_MAX_PAGE_SIZE = 100;

function normalizeRawTransactionText(value: unknown) {
  return asString(value).trim().toLowerCase();
}

function normalizeLedgerTransactionType(
  transactionTypeValue: unknown,
  entryTypeValue: unknown,
  referenceTypeValue: unknown
): LedgerTransactionType {
  const rawTransactionType = normalizeRawTransactionText(transactionTypeValue);
  const rawEntryType = normalizeRawTransactionText(entryTypeValue);
  const rawReferenceType = normalizeRawTransactionText(referenceTypeValue);
  const combined = `${rawTransactionType} ${rawEntryType} ${rawReferenceType}`.trim();

  if (
    rawReferenceType === "commission_batch_approval" ||
    combined.includes("rebate") ||
    combined.includes("settlement") ||
    combined.includes("payout")
  ) {
    return "rebate_settlement";
  }

  if (combined.includes("withdraw")) {
    return "withdrawal_request";
  }

  if (combined.includes("adjust")) {
    return "manual_adjustment";
  }

  if (combined.includes("reverse") || combined.includes("reversal")) {
    return "reversal";
  }

  return "other";
}

function getSignedAmount(amount: number, direction: LedgerRow["direction"]) {
  return direction === "debit" ? -Math.abs(amount) : Math.abs(amount);
}

function getSourceSummary(params: {
  transactionType: LedgerTransactionType;
  referenceType: string | null;
  referenceId: string | null;
  sourceBatchId: string | null;
}) {
  const normalizedReferenceType = (params.referenceType ?? "").toLowerCase();

  if (params.transactionType === "rebate_settlement") {
    const batchId =
      params.sourceBatchId ||
      (normalizedReferenceType === "commission_batch_approval" && params.referenceId
        ? params.referenceId.split(":")[0]
        : null);

    if (batchId) {
      return `Rebate Settlement - Batch #${batchId}`;
    }

    return "Rebate Settlement";
  }

  if (params.transactionType === "withdrawal_request") {
    return "Withdrawal Request";
  }

  if (params.transactionType === "manual_adjustment") {
    return "Manual Adjustment";
  }

  if (params.transactionType === "reversal") {
    return "Reversal Entry";
  }

  if (normalizedReferenceType && params.referenceId) {
    return `${normalizedReferenceType} - ${params.referenceId}`;
  }

  if (normalizedReferenceType) {
    return normalizedReferenceType;
  }

  return "General Ledger Entry";
}

function getTransactionTypeSearchToken(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "rebate_settlement") {
    return "rebate";
  }

  if (normalized === "withdrawal_request") {
    return "withdraw";
  }

  if (normalized === "manual_adjustment") {
    return "adjust";
  }

  if (normalized === "reversal") {
    return "revers";
  }

  return normalized;
}

function compareLedgerRowsByCreatedAtAsc(a: LedgerRow, b: LedgerRow) {
  const aTime = Date.parse(a.created_at);
  const bTime = Date.parse(b.created_at);
  const safeATime = Number.isFinite(aTime) ? aTime : 0;
  const safeBTime = Number.isFinite(bTime) ? bTime : 0;

  if (safeATime !== safeBTime) {
    return safeATime - safeBTime;
  }

  return a.ledger_ref.localeCompare(b.ledger_ref);
}

function ensureLedgerBalanceAfter(rows: LedgerRow[]) {
  if (rows.length === 0) {
    return rows;
  }

  if (!rows.some((row) => row.balance_after === null || row.balance_after === undefined)) {
    return rows;
  }

  const sortedRows = [...rows].sort(compareLedgerRowsByCreatedAtAsc);
  let runningBalance = 0;
  const balanceByLedgerRef = new Map<string, number>();

  for (const row of sortedRows) {
    runningBalance += row.signed_amount;
    balanceByLedgerRef.set(row.ledger_ref, runningBalance);
  }

  return rows.map((row) => ({
    ...row,
    balance_after: row.balance_after ?? balanceByLedgerRef.get(row.ledger_ref) ?? null,
  }));
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFilterValue(value: string) {
  return value.trim();
}

function normalizeSearchKeyword(value: string) {
  return value
    .trim()
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseDateFilter(value: string, mode: "start" | "end") {
  const normalized = normalizeFilterValue(value);
  if (!normalized) {
    return null;
  }

  const parsed = Date.parse(
    /^\d{4}-\d{2}-\d{2}$/.test(normalized)
      ? mode === "start"
        ? `${normalized}T00:00:00.000Z`
        : `${normalized}T23:59:59.999Z`
      : normalized
  );

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

function getDefaultLedgerViewerFilters(): LedgerViewerFilters {
  return {
    query: "",
    user_id: "",
    account_id: "",
    transaction_type: "",
    direction: "all",
    status: "all",
    reference_type: "",
    reference_id: "",
    batch_id: "",
    ledger_ref: "",
    rebate_record_id: "",
    date_from: "",
    date_to: "",
  };
}

function normalizeLedgerViewerFilters(
  filters?: Partial<LedgerViewerFilters> | null
): LedgerViewerFilters {
  const defaults = getDefaultLedgerViewerFilters();
  const raw = filters ?? {};

  const direction =
    raw.direction === "credit" || raw.direction === "debit" ? raw.direction : "all";
  const status =
    raw.status === "posted" || raw.status === "pending" || raw.status === "reversed"
      ? raw.status
      : "all";

  return {
    query: normalizeFilterValue(raw.query ?? defaults.query),
    user_id: normalizeFilterValue(raw.user_id ?? defaults.user_id),
    account_id: normalizeFilterValue(raw.account_id ?? defaults.account_id),
    transaction_type: normalizeFilterValue(raw.transaction_type ?? defaults.transaction_type),
    direction,
    status,
    reference_type: normalizeFilterValue(raw.reference_type ?? defaults.reference_type),
    reference_id: normalizeFilterValue(raw.reference_id ?? defaults.reference_id),
    batch_id: normalizeFilterValue(raw.batch_id ?? defaults.batch_id),
    ledger_ref: normalizeFilterValue(raw.ledger_ref ?? defaults.ledger_ref),
    rebate_record_id: normalizeFilterValue(raw.rebate_record_id ?? defaults.rebate_record_id),
    date_from: normalizeFilterValue(raw.date_from ?? defaults.date_from),
    date_to: normalizeFilterValue(raw.date_to ?? defaults.date_to),
  };
}

function applyLedgerViewerFiltersToRows(rows: LedgerRow[], filters: LedgerViewerFilters) {
  const keyword = normalizeSearchKeyword(filters.query).toLowerCase();
  const dateStart = parseDateFilter(filters.date_from, "start");
  const dateEnd = parseDateFilter(filters.date_to, "end");

  return rows.filter((row) => {
    if (filters.user_id && row.user_id !== filters.user_id) {
      return false;
    }

    if (filters.account_id && row.account_id !== filters.account_id) {
      return false;
    }

    if (filters.transaction_type) {
      const rowTransactionType = row.transaction_type.toLowerCase();
      if (!rowTransactionType.includes(filters.transaction_type.toLowerCase())) {
        return false;
      }
    }

    if (filters.direction !== "all" && row.direction !== filters.direction) {
      return false;
    }

    if (filters.status !== "all" && row.status !== filters.status) {
      return false;
    }

    if (filters.reference_type && row.reference_type !== filters.reference_type) {
      return false;
    }

    if (
      filters.reference_id &&
      !((row.reference_id ?? "").toLowerCase().includes(filters.reference_id.toLowerCase()))
    ) {
      return false;
    }

    if (
      filters.batch_id &&
      !(
        (row.source_batch_id ?? "").toLowerCase() === filters.batch_id.toLowerCase() ||
        (row.reference_id ?? "").toLowerCase().includes(filters.batch_id.toLowerCase())
      )
    ) {
      return false;
    }

    if (filters.ledger_ref && row.ledger_ref !== filters.ledger_ref) {
      return false;
    }

    if (filters.rebate_record_id && row.related_rebate_record !== filters.rebate_record_id) {
      return false;
    }

    if (dateStart || dateEnd) {
      const createdAtTime = Date.parse(row.created_at);
      if (!Number.isFinite(createdAtTime)) {
        return false;
      }

      if (dateStart && createdAtTime < Date.parse(dateStart)) {
        return false;
      }

      if (dateEnd && createdAtTime > Date.parse(dateEnd)) {
        return false;
      }
    }

    if (!keyword) {
      return true;
    }

    const haystack = [
      row.ledger_ref,
      row.user_id ?? "",
      row.user_display ?? "",
      row.account_id,
      row.transaction_type,
      row.raw_transaction_type ?? "",
      row.reference_type ?? "",
      row.reference_id ?? "",
      row.source_summary,
      row.source_batch_id ?? "",
      row.related_rebate_record ?? "",
      row.memo ?? "",
      row.description ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(keyword);
  });
}

function paginateLedgerRows(
  rows: LedgerRow[],
  page: number,
  pageSize: number
): LedgerViewerPage {
  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = clamp(page, 1, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);
  const visibleFrom = totalCount === 0 ? 0 : startIndex + 1;
  const visibleTo = totalCount === 0 ? 0 : Math.min(startIndex + paginatedRows.length, totalCount);

  return {
    rows: paginatedRows,
    pagination: {
      page: safePage,
      pageSize,
      totalCount,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
      visibleFrom,
      visibleTo,
    },
  };
}

function mapLedgerDirection(value: unknown, amount: number): LedgerRow["direction"] {
  const normalized = asString(value).trim().toLowerCase();

  if (normalized === "debit") {
    return "debit";
  }

  if (normalized === "credit") {
    return "credit";
  }

  return amount < 0 ? "debit" : "credit";
}

function mapLedgerStatus(value: unknown): LedgerRow["status"] {
  const normalized = asString(value).trim().toLowerCase();

  if (normalized === "pending" || normalized === "reversed") {
    return normalized;
  }

  return "posted";
}

function mapLedgerRow(row: DbRow): LedgerRow | null {
  const ledgerRef = asString(row.ledger_ref) || asString(row.id);

  if (!ledgerRef) {
    return null;
  }

  const signedAmount = asNumber(row.amount);
  const direction = mapLedgerDirection(row.direction, signedAmount);
  const amount = Math.abs(signedAmount);
  const normalizedTransactionType = normalizeLedgerTransactionType(
    row.transaction_type,
    row.entry_type,
    row.reference_type
  );
  const normalizedSignedAmount = getSignedAmount(amount, direction);
  const status = mapLedgerStatus(row.status);
  const userId = asString(row.user_id) || asString(row.trader_user_id) || null;
  const referenceType = asString(row.reference_type) || null;
  const referenceTypeNormalized = referenceType?.toLowerCase() ?? null;
  const referenceId = asString(row.reference_id) || null;
  const sourceBatchId =
    asString(row.source_batch_id) ||
    (referenceTypeNormalized === "commission_batch_approval" && referenceId
      ? referenceId.split(":")[0] ?? null
      : null) ||
    null;
  const relatedWithdrawalId =
    asString(row.related_withdrawal_id) ||
    (referenceTypeNormalized === "withdrawal" ? referenceId : null) ||
    null;
  const sourceSummary = getSourceSummary({
    transactionType: normalizedTransactionType,
    referenceType,
    referenceId,
    sourceBatchId,
  });

  return {
    ledger_ref: ledgerRef,
    entry_type: asString(row.entry_type) || asString(row.transaction_type, "ledger_entry"),
    transaction_type: normalizedTransactionType,
    raw_transaction_type: asString(row.transaction_type) || asString(row.entry_type) || null,
    beneficiary:
      asString(row.beneficiary) ||
      asString(row.user_email) ||
      asString(row.user_id, "Unknown User"),
    user_id: userId,
    user_display:
      asString(row.user_display) ||
      asString(row.user_email) ||
      asString(row.beneficiary) ||
      (userId ?? null),
    account_id: asString(row.account_id, "-"),
    trader_user_id: asString(row.trader_user_id) || asString(row.user_id, "UNKNOWN"),
    l1_ib_id: asString(row.l1_ib_id) || null,
    l2_ib_id: asString(row.l2_ib_id) || null,
    relationship_snapshot_id: asString(row.relationship_snapshot_id) || null,
    reference_type: referenceType,
    reference_id: referenceId,
    source_batch_id: sourceBatchId,
    source_commission_id: asString(row.source_commission_id) || null,
    related_withdrawal_id: relatedWithdrawalId,
    related_rebate_record:
      asString(row.related_rebate_record) || asString(row.rebate_record_id) || null,
    currency: asString(row.currency) || null,
    memo: asString(row.memo) || asString(row.reason) || asString(row.note) || null,
    description: asString(row.description) || asString(row.detail) || null,
    balance_after: Number.isFinite(Number(row.balance_after)) ? asNumber(row.balance_after) : null,
    signed_amount: normalizedSignedAmount,
    source_summary: sourceSummary,
    allocation_snapshot: isRecord(row.allocation_snapshot) ? row.allocation_snapshot : null,
    raw_record: row,
    amount,
    direction,
    status,
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

function mapWithdrawalStatus(value: unknown): WithdrawalRow["status"] {
  const normalized = asString(value).trim().toLowerCase();

  if (
    normalized === "requested" ||
    normalized === "under_review" ||
    normalized === "approved" ||
    normalized === "rejected" ||
    normalized === "processing" ||
    normalized === "completed" ||
    normalized === "failed" ||
    normalized === "cancelled"
  ) {
    return normalized;
  }

  if (normalized === "pending") {
    return "requested";
  }

  return "requested";
}

function mapWithdrawalRow(row: DbRow): WithdrawalRow | null {
  const withdrawalId =
    asString(row.withdrawal_id) ||
    asString(row.id) ||
    asString(row.request_id);

  if (!withdrawalId) {
    return null;
  }

  const requestAmount = Math.abs(
    asNumber(row.request_amount, asNumber(row.amount))
  );
  const feeAmount = Math.abs(asNumber(row.fee_amount, asNumber(row.fee)));
  const netAmount = Math.max(
    0,
    asNumber(row.net_amount, requestAmount - feeAmount)
  );
  const userId = asString(row.user_id) || asString(row.trader_user_id, "UNKNOWN");
  const payoutMethod =
    asString(row.payout_method) ||
    asString(row.network) ||
    "wallet_transfer";
  const destination =
    asString(row.wallet_address) ||
    asString(row.destination) ||
    asString(row.payout_destination) ||
    "-";
  const currency = asString(row.currency, "USD");

  return {
    withdrawal_id: withdrawalId,
    beneficiary:
      asString(row.beneficiary) ||
      asString(row.user_email) ||
      asString(row.user_id, "Unknown User"),
    user_id: userId,
    request_amount: requestAmount,
    fee_amount: feeAmount,
    net_amount: netAmount,
    currency,
    payout_method: payoutMethod,
    destination,
    review_notes: asString(row.review_notes) || asString(row.operator_notes) || null,
    rejection_reason: asString(row.rejection_reason) || null,
    reviewed_at: asString(row.reviewed_at) || null,
    reviewed_by: asString(row.reviewed_by) || null,
    processed_at: asString(row.processed_at) || null,
    processed_by: asString(row.processed_by) || null,
    reserve_ledger_ref: asString(row.reserve_ledger_ref) || null,
    release_ledger_ref: asString(row.release_ledger_ref) || null,
    payout_ledger_ref: asString(row.payout_ledger_ref) || null,
    idempotency_key: asString(row.idempotency_key) || null,
    events: [],
    linked_ledger_entries: [],
    account_id: asString(row.account_id, "-"),
    trader_user_id: userId,
    l1_ib_id: asString(row.l1_ib_id) || null,
    l2_ib_id: asString(row.l2_ib_id) || null,
    relationship_snapshot_id: asString(row.relationship_snapshot_id) || null,
    amount: requestAmount,
    fee: feeAmount,
    status: mapWithdrawalStatus(row.status),
    requested_at: asString(row.requested_at) || asString(row.created_at, new Date().toISOString()),
    wallet_address: destination,
    network: payoutMethod,
  };
}

function mapWithdrawalEventRow(row: DbRow): WithdrawalEventRow | null {
  const rawEventId = Number(row.event_id);
  if (!Number.isFinite(rawEventId)) {
    return null;
  }

  return {
    event_id: rawEventId,
    previous_status: asString(row.previous_status) || null,
    next_status: asString(row.next_status),
    actor: asString(row.actor) || null,
    reason: asString(row.reason) || null,
    notes: asString(row.notes) || null,
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

function mapWithdrawalLinkedLedgerRow(row: DbRow): WithdrawalLinkedLedgerRow | null {
  const ledgerRef = asString(row.ledger_ref);
  if (!ledgerRef) {
    return null;
  }

  const amount = Math.abs(asNumber(row.amount));
  const direction = mapLedgerDirection(row.direction, asNumber(row.amount));

  return {
    ledger_ref: ledgerRef,
    reference_id: asString(row.reference_id) || null,
    transaction_type:
      asString(row.transaction_type) ||
      asString(row.entry_type) ||
      "withdrawal",
    direction,
    status: asString(row.status, "posted"),
    amount,
    currency: asString(row.currency) || null,
    memo: asString(row.memo) || null,
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

function mapAdjustmentType(value: unknown, fallbackByAmount: number): "credit" | "debit" {
  const normalized = asString(value).trim().toLowerCase();

  if (normalized === "credit" || normalized === "debit") {
    return normalized;
  }

  return fallbackByAmount < 0 ? "debit" : "credit";
}

function mapAdjustmentRow(row: DbRow): AdjustmentRow | null {
  const adjustmentId = asString(row.adjustment_id) || asString(row.id);

  if (!adjustmentId) {
    return null;
  }

  const rawAmount = asNumber(row.amount);
  const adjustmentType = mapAdjustmentType(
    row.adjustment_type ?? row.direction ?? row.transaction_type,
    rawAmount
  );

  return {
    adjustment_id: adjustmentId,
    beneficiary:
      asString(row.beneficiary) ||
      asString(row.user_email) ||
      asString(row.user_id, "Unknown User"),
    account_id: asString(row.account_id, "-"),
    ledger_ref: asString(row.ledger_ref) || null,
    adjustment_type: adjustmentType,
    amount: Math.abs(rawAmount),
    reason: asString(row.reason, "Manual adjustment"),
    operator: asString(row.operator, "Admin Operator"),
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

function mapLedgerRowToAdjustment(row: LedgerRow): AdjustmentRow | null {
  if (!row.entry_type.toLowerCase().includes("adjust")) {
    return null;
  }

  return {
    adjustment_id: `ADJ-${row.ledger_ref}`,
    beneficiary: row.beneficiary,
    account_id: row.account_id,
    ledger_ref: row.ledger_ref,
    adjustment_type: row.direction === "credit" ? "credit" : "debit",
    amount: row.amount,
    reason: `Derived from ledger entry ${row.ledger_ref}`,
    operator: "System",
    created_at: row.created_at,
  };
}

export async function getAdminLedgerRows(): Promise<LedgerRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("finance_ledger")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const mappedRows = (data as DbRow[])
        .map(mapLedgerRow)
        .filter((row): row is LedgerRow => Boolean(row));

      return ensureLedgerBalanceAfter(mappedRows);
    }
  } catch {
    // Fall through to mock data.
  }

  return ensureLedgerBalanceAfter(MOCK_LEDGER_ROWS);
}

export async function getAdminLedgerViewerPage(options?: {
  filters?: Partial<LedgerViewerFilters> | null;
  page?: number | null;
  pageSize?: number | null;
}): Promise<LedgerViewerPage> {
  const filters = normalizeLedgerViewerFilters(options?.filters);
  const requestedPage = Math.max(1, Math.trunc(options?.page ?? 1));
  const pageSize = clamp(
    Math.trunc(options?.pageSize ?? LEDGER_VIEWER_DEFAULT_PAGE_SIZE),
    1,
    LEDGER_VIEWER_MAX_PAGE_SIZE
  );

  try {
    const supabase = await createClient();

    const buildFilteredQuery = () => {
      let query = supabase.from("finance_ledger").select("*", { count: "exact" });

      if (filters.user_id) {
        query = query.eq("user_id", filters.user_id);
      }

      if (filters.account_id) {
        query = query.eq("account_id", filters.account_id);
      }

      if (filters.transaction_type) {
        const transactionToken = getTransactionTypeSearchToken(filters.transaction_type);
        query = query.ilike("transaction_type", `%${transactionToken}%`);
      }

      if (filters.direction !== "all") {
        query = query.eq("direction", filters.direction);
      }

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.reference_type) {
        query = query.eq("reference_type", filters.reference_type);
      }

      if (filters.reference_id) {
        query = query.ilike("reference_id", `%${filters.reference_id}%`);
      }

      if (filters.batch_id) {
        query = query.eq("source_batch_id", filters.batch_id);
      }

      if (filters.ledger_ref) {
        query = query.eq("ledger_ref", filters.ledger_ref);
      }

      if (filters.rebate_record_id) {
        query = query.eq("related_rebate_record", filters.rebate_record_id);
      }

      const dateStart = parseDateFilter(filters.date_from, "start");
      if (dateStart) {
        query = query.gte("created_at", dateStart);
      }

      const dateEnd = parseDateFilter(filters.date_to, "end");
      if (dateEnd) {
        query = query.lte("created_at", dateEnd);
      }

      const keyword = normalizeSearchKeyword(filters.query);
      if (keyword) {
        const pattern = `%${keyword}%`;
        query = query.or(
          [
            `ledger_ref.ilike.${pattern}`,
            `user_id.ilike.${pattern}`,
            `account_id.ilike.${pattern}`,
            `transaction_type.ilike.${pattern}`,
            `reference_id.ilike.${pattern}`,
            `related_rebate_record.ilike.${pattern}`,
            `source_batch_id.ilike.${pattern}`,
          ].join(",")
        );
      }

      return query;
    };

    const executePageQuery = async (page: number) => {
      const offset = (page - 1) * pageSize;
      const limit = offset + pageSize - 1;

      return buildFilteredQuery()
        .order("created_at", { ascending: false })
        .range(offset, limit);
    };

    const executeFullQueryForBalance = async () => {
      return buildFilteredQuery().order("created_at", { ascending: true });
    };

    let safePage = requestedPage;
    let result = await executePageQuery(safePage);

    if (!result.error) {
      const totalCount = result.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      if (safePage > totalPages) {
        safePage = totalPages;
        result = await executePageQuery(safePage);
      }

      if (!result.error) {
        let rows = ((result.data as DbRow[] | null) ?? [])
          .map(mapLedgerRow)
          .filter((row): row is LedgerRow => Boolean(row));

        const missingBalanceAfter = rows.some(
          (row) => row.balance_after === null || row.balance_after === undefined
        );

        if (missingBalanceAfter) {
          const fullResult = await executeFullQueryForBalance();

          if (!fullResult.error) {
            const fullRows = ((fullResult.data as DbRow[] | null) ?? [])
              .map(mapLedgerRow)
              .filter((row): row is LedgerRow => Boolean(row));
            const balancedRows = ensureLedgerBalanceAfter(fullRows);
            const balanceByLedgerRef = new Map(
              balancedRows.map((row) => [row.ledger_ref, row.balance_after ?? null] as const)
            );

            rows = rows.map((row) => ({
              ...row,
              balance_after: row.balance_after ?? balanceByLedgerRef.get(row.ledger_ref) ?? null,
            }));
          }
        }

        const visibleFrom = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
        const visibleTo = totalCount === 0 ? 0 : Math.min(visibleFrom + rows.length - 1, totalCount);

        return {
          rows,
          pagination: {
            page: safePage,
            pageSize,
            totalCount,
            totalPages,
            hasPreviousPage: safePage > 1,
            hasNextPage: safePage < totalPages,
            visibleFrom,
            visibleTo,
          },
        };
      }
    }
  } catch {
    // Fall through to local filtering fallback.
  }

  const localRows = applyLedgerViewerFiltersToRows(await getAdminLedgerRows(), filters);
  return paginateLedgerRows(localRows, requestedPage, pageSize);
}

export async function getAdminWithdrawalRows(): Promise<WithdrawalRow[]> {
  try {
    const supabase = await createClient();
    const primaryResult = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("requested_at", { ascending: false });

    if (!primaryResult.error && primaryResult.data && primaryResult.data.length > 0) {
      const rows = (primaryResult.data as DbRow[])
        .map(mapWithdrawalRow)
        .filter((row): row is WithdrawalRow => Boolean(row));

      const withdrawalIds = rows.map((row) => row.withdrawal_id);

      if (withdrawalIds.length === 0) {
        return rows;
      }

      const [eventsResult, ledgerResult] = await Promise.all([
        supabase
          .from("withdrawal_request_events")
          .select("*")
          .in("withdrawal_id", withdrawalIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("finance_ledger")
          .select("ledger_ref,reference_id,related_withdrawal_id,transaction_type,entry_type,direction,status,amount,currency,memo,created_at")
          .eq("reference_type", "withdrawal")
          .in("related_withdrawal_id", withdrawalIds)
          .order("created_at", { ascending: false }),
      ]);

      const eventsByWithdrawalId = new Map<string, WithdrawalEventRow[]>();
      if (!eventsResult.error && eventsResult.data) {
        for (const row of eventsResult.data as DbRow[]) {
          const withdrawalId = asString(row.withdrawal_id);
          const mapped = mapWithdrawalEventRow(row);
          if (!withdrawalId || !mapped) {
            continue;
          }

          const list = eventsByWithdrawalId.get(withdrawalId) ?? [];
          list.push(mapped);
          eventsByWithdrawalId.set(withdrawalId, list);
        }
      }

      const ledgerByWithdrawalId = new Map<string, WithdrawalLinkedLedgerRow[]>();
      if (!ledgerResult.error && ledgerResult.data) {
        for (const row of ledgerResult.data as DbRow[]) {
          const withdrawalId = asString(row.related_withdrawal_id);
          const mapped = mapWithdrawalLinkedLedgerRow(row);
          if (!withdrawalId || !mapped) {
            continue;
          }

          const list = ledgerByWithdrawalId.get(withdrawalId) ?? [];
          list.push(mapped);
          ledgerByWithdrawalId.set(withdrawalId, list);
        }
      }

      return rows.map((row) => ({
        ...row,
        events: eventsByWithdrawalId.get(row.withdrawal_id) ?? [],
        linked_ledger_entries: ledgerByWithdrawalId.get(row.withdrawal_id) ?? [],
      }));
    }

    const legacyResult = await supabase
      .from("withdrawals")
      .select("*")
      .order("requested_at", { ascending: false });

    if (!legacyResult.error && legacyResult.data && legacyResult.data.length > 0) {
      return (legacyResult.data as DbRow[])
        .map(mapWithdrawalRow)
        .filter((row): row is WithdrawalRow => Boolean(row));
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_WITHDRAWALS;
}

export async function getAdminAdjustmentRows(): Promise<AdjustmentRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("adjustments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const rows = (data as DbRow[])
        .map(mapAdjustmentRow)
        .filter((row): row is AdjustmentRow => Boolean(row));

      if (rows.length > 0) {
        return rows;
      }
    }
  } catch {
    // Fall through to ledger-derived adjustments.
  }

  const ledgerRows = await getAdminLedgerRows();
  const ledgerDerivedRows = ledgerRows
    .map(mapLedgerRowToAdjustment)
    .filter((row): row is AdjustmentRow => Boolean(row));

  if (ledgerDerivedRows.length > 0) {
    return ledgerDerivedRows;
  }

  return MOCK_ADJUSTMENTS;
}

export async function getAdminReconciliationRows(): Promise<ReconciliationRow[]> {
  return MOCK_RECONCILIATION_ROWS;
}

export async function getAdminFinanceHub(): Promise<FinanceHubData> {
  const [ledgerRows, withdrawals, adjustments, reconciliationRows] = await Promise.all([
    getAdminLedgerRows(),
    getAdminWithdrawalRows(),
    getAdminAdjustmentRows(),
    getAdminReconciliationRows(),
  ]);

  return {
    ...MOCK_FINANCE_HUB_DATA,
    ledgerRows,
    withdrawals,
    adjustments,
    reconciliationRows,
  };
}
