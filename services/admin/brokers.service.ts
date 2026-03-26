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
import type { BrokerDetailData } from "@/app/admin/brokers/[broker_id]/_types";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapBrokerListRow(row: DbRow): BrokerListRow | null {
  const brokerId = asString(row.broker_id) || asString(row.id);
  const brokerName = asString(row.broker_name) || asString(row.name);

  if (!brokerId && !brokerName) {
    return null;
  }

  const status: BrokerListRow["status"] =
    asString(row.status) === "inactive" ? "inactive" : "active";

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

export async function getAdminBrokers(): Promise<BrokerWorkspaceData> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("admin_broker_stats").select("*");

    if (!error && data && data.length > 0) {
      return {
        rows: (data as DbRow[])
          .map(mapBrokerListRow)
          .filter((row): row is BrokerListRow => Boolean(row)),
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

    const [brokerStatsResult, recentBatchesResult] = await Promise.all([
      supabase.from("admin_broker_stats").select("*").eq("broker_id", brokerId).maybeSingle(),
      supabase
        .from("commission_batches")
        .select("batch_id, status, record_count, imported_at, import_date")
        .eq("broker", brokerId)
        .order("imported_at", { ascending: false })
        .limit(5),
    ]);

    const recentBatches =
      !recentBatchesResult.error && recentBatchesResult.data && recentBatchesResult.data.length > 0
        ? (recentBatchesResult.data as DbRow[]).map((row) => ({
            batch_id: asString(row.batch_id, "UNKNOWN"),
            status: asString(row.status, "review"),
            records: asNumber(row.record_count),
            imported_at:
              asString(row.imported_at) ||
              asString(row.import_date, new Date().toISOString()),
          }))
        : MOCK_RECENT_BATCHES;

    if (!brokerStatsResult.error && brokerStatsResult.data) {
      const row = brokerStatsResult.data as DbRow;

      return {
        brokerId,
        summary: {
          total_commission:
            asNumber(row.total_commission) || MOCK_BROKER_SUMMARY.total_commission,
          total_rebate: asNumber(row.total_rebate) || MOCK_BROKER_SUMMARY.total_rebate,
          platform_profit:
            asNumber(row.platform_profit) || MOCK_BROKER_SUMMARY.platform_profit,
          active_batches:
            asNumber(row.active_batches) || asNumber(row.commission_batches) || recentBatches.length,
        },
        recentBatches,
        importConfig: MOCK_BROKER_IMPORT_CONFIG,
        mappingRules: MOCK_BROKER_MAPPING_RULES,
        commissionConfig: MOCK_BROKER_COMMISSION_CONFIG,
        accountTypeCoverage: MOCK_BROKER_ACCOUNT_TYPE_COVERAGE,
      };
    }
  } catch {
    // Fall through to mock data.
  }

  return {
    brokerId,
    summary: MOCK_BROKER_SUMMARY,
    recentBatches: MOCK_RECENT_BATCHES,
    importConfig: MOCK_BROKER_IMPORT_CONFIG,
    mappingRules: MOCK_BROKER_MAPPING_RULES,
    commissionConfig: MOCK_BROKER_COMMISSION_CONFIG,
    accountTypeCoverage: MOCK_BROKER_ACCOUNT_TYPE_COVERAGE,
  };
}
