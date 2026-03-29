export type DashboardKpiRow = {
  total_users: number;
  total_active_accounts: number;
  total_commission: number;
  total_rebates: number;
  platform_profit: number;
};

export type DashboardMetricRow = {
  date: string;
  value: number;
};

export type DashboardLockedFundsRow = {
  locked_amount: number;
  affected_users: number;
  release_window_label: string;
};

export type DashboardBrokerVolumeRow = {
  broker: string;
  volume: number;
  accounts: number;
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
      total_active_accounts: 962,
      total_commission: 985430.22,
      total_rebates: 312505.88,
      platform_profit: 128644.12,
    } satisfies DashboardKpiRow,
    previous_kpi: {
      total_users: 1153,
      total_active_accounts: 904,
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
    rebateDaily: [
      { date: "Mon", value: 6220 },
      { date: "Tue", value: 6580 },
      { date: "Wed", value: 6890 },
      { date: "Thu", value: 6710 },
      { date: "Fri", value: 7240 },
      { date: "Sat", value: 7380 },
    ] satisfies DashboardMetricRow[],
    platformProfitDaily: [
      { date: "Mon", value: 5300 },
      { date: "Tue", value: 5450 },
      { date: "Wed", value: 6180 },
      { date: "Thu", value: 5920 },
      { date: "Fri", value: 6500 },
      { date: "Sat", value: 6890 },
    ] satisfies DashboardMetricRow[],
    lockedFunds: {
      locked_amount: 48320.54,
      affected_users: 18,
      release_window_label: "12-hour safety window",
    } satisfies DashboardLockedFundsRow,
    brokerVolume: [
      { broker: "Axi", volume: 1284.5, accounts: 412 },
      { broker: "TMGM", volume: 1142.8, accounts: 365 },
      { broker: "VT Markets", volume: 972.4, accounts: 308 },
      { broker: "IC Markets", volume: 841.2, accounts: 276 },
    ] satisfies DashboardBrokerVolumeRow[],
    ibRanking: [
      { ib_id: "IB-1101", ib_name: "North Desk", total_rebate: 45200, trader_count: 41 },
      { ib_id: "IB-1164", ib_name: "Alpha Network", total_rebate: 39110, trader_count: 35 },
      { ib_id: "IB-1209", ib_name: "Zenith Group", total_rebate: 33890, trader_count: 29 },
    ] satisfies DashboardIbRankingRow[],
  };
}
