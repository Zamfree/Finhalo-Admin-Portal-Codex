import type {
  BrokerAccountTypeCoverage,
  BrokerCommissionConfiguration,
  BrokerDetailSummary,
  BrokerImportConfiguration,
  BrokerMappingRule,
  RecentBatchRow,
} from "./_types";

export const MOCK_BROKER_SUMMARY: BrokerDetailSummary = {
  total_commission: 231120.55,
  total_rebate: 72120.34,
  platform_profit: 31220.76,
  active_batches: 12,
};

export const MOCK_RECENT_BATCHES: RecentBatchRow[] = [
  { batch_id: "BATCH-2401", status: "approved", records: 210, imported_at: "2026-03-18T06:14:00Z" },
  { batch_id: "BATCH-2407", status: "pending", records: 198, imported_at: "2026-03-19T04:20:00Z" },
  { batch_id: "BATCH-2410", status: "pending", records: 176, imported_at: "2026-03-19T09:05:00Z" },
];

export const MOCK_BROKER_IMPORT_CONFIG: BrokerImportConfiguration = {
  source_format: "CSV / XLSX",
  ingestion_mode: "Batch import with pre-validation",
  timezone: "UTC+8",
  latest_import_at: "2026-03-19T09:05:00Z",
};

export const MOCK_BROKER_MAPPING_RULES: BrokerMappingRule[] = [
  {
    rule_id: "MAP-001",
    field_label: "Trading Account",
    source_column: "account_login",
    status: "ready",
    note: "Used as the primary broker account identifier.",
  },
  {
    rule_id: "MAP-002",
    field_label: "Gross Commission",
    source_column: "gross_commission",
    status: "ready",
    note: "Feeds commission record creation before rebate calculation.",
  },
  {
    rule_id: "MAP-003",
    field_label: "Account Type",
    source_column: "account_group",
    status: "review",
    note: "Requires periodic review when broker groups change.",
  },
];

export const MOCK_BROKER_COMMISSION_CONFIG: BrokerCommissionConfiguration = {
  calculation_model: "Batch-derived commission allocation",
  settlement_window: "T+1 operational review",
  rebate_depth: "L1 / L2",
  admin_fee_floor: "10%",
};

export const MOCK_BROKER_ACCOUNT_TYPE_COVERAGE: BrokerAccountTypeCoverage[] = [
  {
    account_type: "Standard",
    rebate_eligible: true,
    mapping_status: "mapped",
    note: "Primary live trading coverage.",
  },
  {
    account_type: "Raw Spread",
    rebate_eligible: true,
    mapping_status: "mapped",
    note: "Included in commission import mapping.",
  },
  {
    account_type: "Demo",
    rebate_eligible: false,
    mapping_status: "review",
    note: "Excluded from rebate posting and reviewed separately.",
  },
];
