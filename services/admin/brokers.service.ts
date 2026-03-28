import { MOCK_BROKERS } from "@/app/admin/brokers/_mock-data";
import type { BrokerListRow, BrokerWorkspaceData } from "@/app/admin/brokers/_types";
import {
  MOCK_BROKER_ACCOUNT_TYPE_COVERAGE,
  MOCK_BROKER_COMMISSION_CONFIG,
  MOCK_BROKER_IMPORT_CONFIG,
  MOCK_BROKER_MAPPING_RULES,
  MOCK_BROKER_SUMMARY,
  MOCK_RECENT_BATCHES,
} from "@/app/admin/brokers/[broker_id]/_mock-data";
import type {
  BrokerAccountTypeCoverage,
  BrokerCommissionConfiguration,
  BrokerDetailData,
  BrokerImportConfiguration,
  BrokerMappingRule,
  BrokerDetailSummary,
  RecentBatchRow,
} from "@/app/admin/brokers/[broker_id]/_types";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return fallback;
}

function asStatus(value: unknown): "active" | "inactive" {
  return asString(value).trim().toLowerCase() === "inactive" ? "inactive" : "active";
}

function isRecord(value: unknown): value is DbRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  return value;
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function mapBrokerListRow(row: DbRow): BrokerListRow | null {
  const brokerId = asString(row.broker_id) || asString(row.id);
  const brokerName = asString(row.broker_name) || asString(row.name);

  if (!brokerId && !brokerName) {
    return null;
  }

  const status = asStatus(row.status);

  return {
    broker_id: brokerId || brokerName,
    broker_name: brokerName || brokerId,
    status,
    accounts: asNumber(row.accounts) || asNumber(row.linked_accounts),
    created_at: asString(row.created_at, new Date().toISOString()),
    commission_batches:
      asNumber(row.commission_batches) || asNumber(row.batch_count),
    latest_batch_id: asString(row.latest_batch_id) || null,
  };
}

function parseImportConfig(row: DbRow | null): BrokerImportConfiguration {
  if (!row) {
    return MOCK_BROKER_IMPORT_CONFIG;
  }

  const raw =
    parseJsonLike(row.import_config) ??
    parseJsonLike(row.import_configuration) ??
    parseJsonLike(row.ingestion_config);

  if (isRecord(raw)) {
    return {
      source_format: asString(raw.source_format, MOCK_BROKER_IMPORT_CONFIG.source_format),
      ingestion_mode: asString(raw.ingestion_mode, MOCK_BROKER_IMPORT_CONFIG.ingestion_mode),
      timezone: asString(raw.timezone, MOCK_BROKER_IMPORT_CONFIG.timezone),
      latest_import_at: asString(raw.latest_import_at, MOCK_BROKER_IMPORT_CONFIG.latest_import_at),
    };
  }

  return MOCK_BROKER_IMPORT_CONFIG;
}

function parseCommissionConfig(row: DbRow | null): BrokerCommissionConfiguration {
  if (!row) {
    return MOCK_BROKER_COMMISSION_CONFIG;
  }

  const raw =
    parseJsonLike(row.commission_config) ??
    parseJsonLike(row.commission_configuration);

  if (isRecord(raw)) {
    return {
      calculation_model: asString(
        raw.calculation_model,
        MOCK_BROKER_COMMISSION_CONFIG.calculation_model
      ),
      settlement_window: asString(
        raw.settlement_window,
        MOCK_BROKER_COMMISSION_CONFIG.settlement_window
      ),
      rebate_depth: asString(raw.rebate_depth, MOCK_BROKER_COMMISSION_CONFIG.rebate_depth),
      admin_fee_floor: asString(
        raw.admin_fee_floor,
        MOCK_BROKER_COMMISSION_CONFIG.admin_fee_floor
      ),
    };
  }

  return MOCK_BROKER_COMMISSION_CONFIG;
}

function parseAccountTypeCoverage(row: DbRow | null): BrokerAccountTypeCoverage[] {
  if (!row) {
    return MOCK_BROKER_ACCOUNT_TYPE_COVERAGE;
  }

  const raw =
    parseJsonLike(row.account_type_coverage) ??
    parseJsonLike(row.account_types) ??
    parseJsonLike(row.account_type_config);

  if (!Array.isArray(raw)) {
    return MOCK_BROKER_ACCOUNT_TYPE_COVERAGE;
  }

  const mapped = raw
    .filter(isRecord)
    .map((item, index) => {
      const mappingStatus: BrokerAccountTypeCoverage["mapping_status"] =
        asString(item.mapping_status).trim().toLowerCase() === "review" ? "review" : "mapped";

      return {
        account_type: asString(item.account_type, `TYPE-${index + 1}`),
        rebate_eligible: asBoolean(item.rebate_eligible, true),
        mapping_status: mappingStatus,
        note: asString(item.note, ""),
      };
    })
    .filter((item) => item.account_type.trim().length > 0);

  return mapped.length > 0 ? mapped : MOCK_BROKER_ACCOUNT_TYPE_COVERAGE;
}

function parseMappingRules(row: DbRow | null): BrokerMappingRule[] {
  if (!row) {
    return MOCK_BROKER_MAPPING_RULES;
  }

  const raw =
    parseJsonLike(row.mapping_rules) ??
    parseJsonLike(row.import_mapping_rules) ??
    parseJsonLike(row.import_rules);

  if (!Array.isArray(raw)) {
    return MOCK_BROKER_MAPPING_RULES;
  }

  const mapped = raw
    .filter(isRecord)
    .map((item, index) => {
      const statusRaw = asString(item.status).trim().toLowerCase();
      const status: BrokerMappingRule["status"] =
        statusRaw === "ready" || statusRaw === "missing" ? statusRaw : "review";

      return {
        rule_id: asString(item.rule_id, `MAP-${index + 1}`),
        field_label: asString(item.field_label, ""),
        source_column: asString(item.source_column, ""),
        status,
        note: asString(item.note, ""),
      };
    })
    .filter((item) => item.field_label.trim().length > 0);

  return mapped.length > 0 ? mapped : MOCK_BROKER_MAPPING_RULES;
}

function parseSummary(row: DbRow | null, recentBatches: RecentBatchRow[]): BrokerDetailSummary {
  if (!row) {
    return {
      ...MOCK_BROKER_SUMMARY,
      active_batches: recentBatches.length,
    };
  }

  return {
    total_commission: asNumber(row.total_commission) || MOCK_BROKER_SUMMARY.total_commission,
    total_rebate: asNumber(row.total_rebate) || MOCK_BROKER_SUMMARY.total_rebate,
    platform_profit: asNumber(row.platform_profit) || MOCK_BROKER_SUMMARY.platform_profit,
    active_batches:
      asNumber(row.active_batches) || asNumber(row.commission_batches) || recentBatches.length,
  };
}

async function getBrokerProfileRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  brokerId: string
): Promise<DbRow | null> {
  const keyAttempts = ["broker_id", "id"] as const;

  for (const key of keyAttempts) {
    const result = await supabase.from("brokers").select("*").eq(key, brokerId).maybeSingle();

    if (!result.error && result.data) {
      return result.data as DbRow;
    }

    if (result.error && !isMissingColumnError(result.error.message)) {
      break;
    }
  }

  return null;
}

async function getRecentBatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  brokerValues: string[]
): Promise<RecentBatchRow[]> {
  for (const brokerValue of brokerValues) {
    if (!brokerValue) {
      continue;
    }

    const result = await supabase
      .from("commission_batches")
      .select("batch_id, status, record_count, imported_at, import_date")
      .eq("broker", brokerValue)
      .order("imported_at", { ascending: false })
      .limit(5);

    if (!result.error && result.data && result.data.length > 0) {
      return (result.data as DbRow[]).map((row) => ({
        batch_id: asString(row.batch_id, "UNKNOWN"),
        status: asString(row.status, "review"),
        records: asNumber(row.record_count),
        imported_at:
          asString(row.imported_at) || asString(row.import_date, new Date().toISOString()),
      }));
    }
  }

  return MOCK_RECENT_BATCHES;
}

export async function getAdminBrokers(): Promise<BrokerWorkspaceData> {
  try {
    const supabase = await createClient();
    const [statsResult, brokersResult] = await Promise.all([
      supabase.from("admin_broker_stats").select("*"),
      supabase.from("brokers").select("*"),
    ]);
    const rowsByBrokerId = new Map<string, BrokerListRow>();

    if (!statsResult.error && statsResult.data) {
      for (const row of statsResult.data as DbRow[]) {
        const mapped = mapBrokerListRow(row);

        if (mapped) {
          rowsByBrokerId.set(mapped.broker_id, mapped);
        }
      }
    }

    if (!brokersResult.error && brokersResult.data) {
      for (const row of brokersResult.data as DbRow[]) {
        const mapped = mapBrokerListRow(row);

        if (!mapped) {
          continue;
        }

        const existing = rowsByBrokerId.get(mapped.broker_id);

        if (!existing) {
          rowsByBrokerId.set(mapped.broker_id, mapped);
          continue;
        }

        rowsByBrokerId.set(mapped.broker_id, {
          ...existing,
          broker_name: mapped.broker_name || existing.broker_name,
          status: mapped.status,
          created_at: mapped.created_at || existing.created_at,
        });
      }
    }

    if (rowsByBrokerId.size > 0) {
      return {
        rows: [...rowsByBrokerId.values()].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      };
    }
  } catch {
    // Fall through to mock data.
  }

  return {
    rows: MOCK_BROKERS,
  };
}

export async function getAdminBrokerDetail(brokerId: string): Promise<BrokerDetailData> {
  try {
    const supabase = await createClient();
    const [brokerStatsResult, brokerProfileRow] = await Promise.all([
      supabase.from("admin_broker_stats").select("*").eq("broker_id", brokerId).maybeSingle(),
      getBrokerProfileRow(supabase, brokerId),
    ]);
    const brokerName =
      asString(brokerProfileRow?.broker_name) ||
      asString(brokerProfileRow?.name) ||
      brokerId;
    const recentBatches = await getRecentBatches(supabase, [brokerId, brokerName]);

    return {
      brokerId,
      brokerName,
      status: asStatus(brokerProfileRow?.status),
      summary: parseSummary(
        !brokerStatsResult.error && brokerStatsResult.data
          ? (brokerStatsResult.data as DbRow)
          : null,
        recentBatches
      ),
      recentBatches,
      importConfig: parseImportConfig(brokerProfileRow),
      mappingRules: parseMappingRules(brokerProfileRow),
      commissionConfig: parseCommissionConfig(brokerProfileRow),
      accountTypeCoverage: parseAccountTypeCoverage(brokerProfileRow),
    };
  } catch {
    // Fall through to mock data.
  }

  return {
    brokerId,
    brokerName: brokerId,
    status: "active",
    summary: MOCK_BROKER_SUMMARY,
    recentBatches: MOCK_RECENT_BATCHES,
    importConfig: MOCK_BROKER_IMPORT_CONFIG,
    mappingRules: MOCK_BROKER_MAPPING_RULES,
    commissionConfig: MOCK_BROKER_COMMISSION_CONFIG,
    accountTypeCoverage: MOCK_BROKER_ACCOUNT_TYPE_COVERAGE,
  };
}
