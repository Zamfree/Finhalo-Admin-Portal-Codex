export type BrokerDetailSummary = {
  total_commission: number;
  total_rebate: number;
  platform_profit: number;
  active_batches: number;
};

export type BrokerImportConfiguration = {
  source_format: string;
  ingestion_mode: string;
  timezone: string;
  latest_import_at: string;
};

export type BrokerMappingRule = {
  rule_id: string;
  field_label: string;
  source_column: string;
  status: "ready" | "review" | "missing";
  note: string;
};

export type BrokerCommissionConfiguration = {
  calculation_model: string;
  settlement_window: string;
  rebate_depth: string;
  admin_fee_floor: string;
};

export type BrokerAccountTypeCoverage = {
  account_type: string;
  rebate_eligible: boolean;
  mapping_status: "mapped" | "review";
  note: string;
};

export type RecentBatchRow = {
  batch_id: string;
  status: string;
  records: number;
  imported_at: string;
};

export type BrokerDetailData = {
  brokerId: string;
  summary: BrokerDetailSummary;
  recentBatches: RecentBatchRow[];
  importConfig: BrokerImportConfiguration;
  mappingRules: BrokerMappingRule[];
  commissionConfig: BrokerCommissionConfiguration;
  accountTypeCoverage: BrokerAccountTypeCoverage[];
};
