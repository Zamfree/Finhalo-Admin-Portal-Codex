import {
  getDashboardData,
  type DashboardBrokerVolumeRow,
  type DashboardIbRankingRow,
  type DashboardKpiRow,
  type DashboardLockedFundsRow,
  type DashboardMetricRow,
} from "@/app/admin/dashboard/_mock-data";
import { createClient } from "@/lib/supabase/server";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapKpiRow(row: DbRow): DashboardKpiRow {
  return {
    total_users: asNumber(row.total_users),
    total_commission: asNumber(row.total_commission),
    total_rebates: asNumber(row.total_rebates),
    platform_profit: asNumber(row.platform_profit),
  };
}

function mapMetricRows(rows: DbRow[], preferredValueKeys: string[]): DashboardMetricRow[] {
  return rows.map((row, index) => {
    const valueKey = preferredValueKeys.find((key) => row[key] !== undefined);
    return {
      date:
        asString(row.label) ||
        asString(row.day) ||
        asString(row.date) ||
        `Row ${index + 1}`,
      value: valueKey ? asNumber(row[valueKey]) : 0,
    };
  });
}

function mapBrokerVolumeRows(rows: DbRow[]): DashboardBrokerVolumeRow[] {
  return rows.map((row) => ({
    broker: asString(row.broker_name) || asString(row.broker, "Unknown Broker"),
    volume: asNumber(row.volume) || asNumber(row.total_volume),
    accounts: asNumber(row.accounts) || asNumber(row.linked_accounts),
  }));
}

function mapIbRankingRows(rows: DbRow[]): DashboardIbRankingRow[] {
  return rows.map((row) => ({
    ib_id: asString(row.ib_id) || asString(row.user_id, "UNKNOWN"),
    ib_name: asString(row.ib_name) || asString(row.display_name, "Unknown IB"),
    total_rebate: asNumber(row.total_rebate) || asNumber(row.rebate_amount),
    trader_count: asNumber(row.trader_count) || asNumber(row.downline_count),
  }));
}

function getLockedFundsFallback(base: DashboardData): DashboardLockedFundsRow {
  return base.lockedFunds;
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  const base = await getDashboardData();

  try {
    const supabase = await createClient();
    const [
      kpiResult,
      commissionDailyResult,
      platformProfitDailyResult,
      brokerStatsResult,
      ibRankingResult,
    ] = await Promise.all([
      supabase.from("admin_kpi_overview").select("*").limit(1).maybeSingle(),
      supabase.from("admin_commission_daily").select("*").order("date", { ascending: true }),
      supabase.from("admin_platform_profit_daily").select("*").order("date", { ascending: true }),
      supabase.from("admin_broker_stats").select("*"),
      supabase.from("admin_ib_ranking").select("*"),
    ]);

    return {
      kpi:
        !kpiResult.error && kpiResult.data
          ? mapKpiRow(kpiResult.data as DbRow)
          : base.kpi,
      previous_kpi: base.previous_kpi,
      commissionDaily:
        !commissionDailyResult.error && commissionDailyResult.data && commissionDailyResult.data.length > 0
          ? mapMetricRows(commissionDailyResult.data as DbRow[], ["total_commission", "value", "amount"])
          : base.commissionDaily,
      rebateDaily: base.rebateDaily,
      platformProfitDaily:
        !platformProfitDailyResult.error &&
        platformProfitDailyResult.data &&
        platformProfitDailyResult.data.length > 0
          ? mapMetricRows(platformProfitDailyResult.data as DbRow[], [
              "platform_profit",
              "value",
              "amount",
            ])
          : base.platformProfitDaily,
      lockedFunds: getLockedFundsFallback(base),
      brokerVolume:
        !brokerStatsResult.error && brokerStatsResult.data && brokerStatsResult.data.length > 0
          ? mapBrokerVolumeRows(brokerStatsResult.data as DbRow[])
          : base.brokerVolume,
      ibRanking:
        !ibRankingResult.error && ibRankingResult.data && ibRankingResult.data.length > 0
          ? mapIbRankingRows(ibRankingResult.data as DbRow[])
          : base.ibRanking,
    };
  } catch {
    return base;
  }
}
