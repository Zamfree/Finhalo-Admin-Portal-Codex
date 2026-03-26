import type { KpiCardModel } from "@/types/system/kpi";
import type { DashboardKpiRow } from "./_mock-data";

export function formatDashboardKpi(
  title: string,
  currentValue: number,
  previousValue: number,
  format: "integer" | "currency"
): KpiCardModel & { change: string } {
  const change = ((currentValue - previousValue) / previousValue) * 100;
  const prefix = change >= 0 ? "+" : "";

  const value =
    format === "integer"
      ? currentValue.toLocaleString("en-US")
      : currentValue.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });

  return {
    label: title,
    value,
    change: `${prefix}${change.toFixed(1)}%`,
  };
}

export function mapDashboardKpis(
  kpi: DashboardKpiRow,
  previous: DashboardKpiRow
) {
  return [
    formatDashboardKpi("Total Users", kpi.total_users, previous.total_users, "integer"),
    formatDashboardKpi(
      "Total Commission",
      kpi.total_commission,
      previous.total_commission,
      "currency"
    ),
    formatDashboardKpi("Total Rebates", kpi.total_rebates, previous.total_rebates, "currency"),
    formatDashboardKpi(
      "Platform Profit",
      kpi.platform_profit,
      previous.platform_profit,
      "currency"
    ),
  ];
}
