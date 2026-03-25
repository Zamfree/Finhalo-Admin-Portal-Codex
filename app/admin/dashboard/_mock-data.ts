export type DashboardKpiRow = {
  total_users: number;
  total_commission: number;
  total_rebates: number;
  platform_profit: number;
};

export type DashboardMetricRow = {
  date: string;
  value: number;
};

export type DashboardIbRankingRow = {
  ib_id: string;
  ib_name: string;
  total_rebate: number;
  trader_count: number;
};

export async function getDashboardData() {
  return {
    kpi: {
      total_users: 1248,
      total_commission: 985430.22,
      total_rebates: 312505.88,
      platform_profit: 128644.12,
    } satisfies DashboardKpiRow,
    previous_kpi: {
      total_users: 1153,
      total_commission: 933550.78,
      total_rebates: 299870.1,
      platform_profit: 120450.9,
    } satisfies DashboardKpiRow,
    commissionDaily: [
      { date: "Mon", value: 20100 },
      { date: "Tue", value: 22450 },
      { date: "Wed", value: 24520 },
      { date: "Thu", value: 23180 },
      { date: "Fri", value: 26210 },
      { date: "Sat", value: 27100 },
    ] satisfies DashboardMetricRow[],
    platformProfitDaily: [
      { date: "Mon", value: 5300 },
      { date: "Tue", value: 5450 },
      { date: "Wed", value: 6180 },
      { date: "Thu", value: 5920 },
      { date: "Fri", value: 6500 },
      { date: "Sat", value: 6890 },
    ] satisfies DashboardMetricRow[],
    ibRanking: [
      { ib_id: "IB-1101", ib_name: "North Desk", total_rebate: 45200, trader_count: 41 },
      { ib_id: "IB-1164", ib_name: "Alpha Network", total_rebate: 39110, trader_count: 35 },
      { ib_id: "IB-1209", ib_name: "Zenith Group", total_rebate: 33890, trader_count: 29 },
    ] satisfies DashboardIbRankingRow[],
  };
}
