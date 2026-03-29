export const COMMISSION_CANONICAL_FIELDS = [
  {
    key: "broker",
    label: "Broker",
    description: "Broker identifier for this import batch.",
    required: true,
  },
  {
    key: "account_id",
    label: "Account ID",
    description: "Internal trading account id when provided by source.",
    required: false,
  },
  {
    key: "account_number",
    label: "Account Number",
    description: "Broker account/login identifier.",
    required: true,
  },
  {
    key: "commission_amount",
    label: "Commission Amount",
    description: "Gross commission amount for the commission event.",
    required: true,
  },
  {
    key: "commission_date",
    label: "Commission Date",
    description: "Event date/time used for relationship snapshot resolution.",
    required: true,
  },
  {
    key: "volume",
    label: "Volume / Lot",
    description: "Trading volume or lot size when provided.",
    required: false,
  },
  {
    key: "symbol",
    label: "Symbol",
    description: "Instrument symbol when provided.",
    required: false,
  },
  {
    key: "currency",
    label: "Currency",
    description: "Commission currency when provided.",
    required: false,
  },
  {
    key: "account_type",
    label: "Account Type",
    description: "Account group/type when provided.",
    required: false,
  },
] as const;

export type CommissionCanonicalField = (typeof COMMISSION_CANONICAL_FIELDS)[number]["key"];

export type CommissionUploadMapping = Partial<Record<CommissionCanonicalField, string>>;

export const REQUIRED_MAPPING_FIELDS: CommissionCanonicalField[] = [
  "commission_amount",
  "commission_date",
];

export const ACCOUNT_IDENTIFIER_MAPPING_FIELDS: CommissionCanonicalField[] = [
  "account_id",
  "account_number",
];

