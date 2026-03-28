import type { FilterBarBaseProps } from "@/types/system/filters";
import type {
  AccountRelationshipSnapshotRecord,
  IbRelationshipSnapshotStatus,
  NetworkHistoryItem,
} from "@/types/domain/network";

export type NetworkNodeRole = "trader" | "l1" | "l2";
export type NetworkNodeStatus = IbRelationshipSnapshotStatus;
export type NetworkStatusFilter = "all" | NetworkNodeStatus;

export type NetworkSnapshotHistoryItem = NetworkHistoryItem & {
  oldTraderName?: string | null;
  oldL1Name?: string | null;
  oldL2Name?: string | null;
  newTraderName?: string | null;
  newL1Name?: string | null;
  newL2Name?: string | null;
};

export type NetworkSnapshotRecord = AccountRelationshipSnapshotRecord & {
  source: string;
  changeReason?: string | null;
  createdBy?: string | null;
  history: NetworkSnapshotHistoryItem[];
};

export type NetworkFilters = {
  query: string;
  status: NetworkStatusFilter;
};

export type NetworkFilterOption = {
  value: NetworkStatusFilter;
  label: string;
};

export type NetworkNodeSummary = {
  totalNodes: number;
  activeIbs: number;
  totalDownlines: number;
  activeTraders: number;
};

export type NetworkIbStatsRow = {
  ibUserId: string;
  displayName: string;
  role: "l1" | "l2" | "mixed";
  directReferrals: number;
  totalDownline: number;
  linkedAccountsCount: number;
  activeAccountCount: number;
  status: NetworkNodeStatus;
};

export type NetworkAccountRelationshipRow = {
  snapshotId: string;
  accountId: string;
  accountCode: string;
  brokerName: string;
  traderLabel: string;
  l1Label: string;
  l2Label: string;
  snapshotStatus: NetworkNodeStatus;
  effectiveFrom: string;
  updatedAt: string;
  isCurrent: boolean;
};

export type NetworkNodeReference = {
  nodeId: string;
  displayName: string;
  email?: string;
  primaryRole: NetworkNodeRole;
};

export type NetworkLinkedAccountRef = {
  accountId: string;
  accountCode: string;
  brokerName: string;
  snapshotId: string;
  snapshotStatus: NetworkNodeStatus;
};

export type NetworkNodeRow = {
  nodeId: string;
  displayName: string;
  email?: string;
  primaryRole: NetworkNodeRole;
  roles: NetworkNodeRole[];
  uplinkLabel: string;
  uplinkCount: number;
  directReferrals: number;
  totalDownline: number;
  linkedAccountsCount: number;
  activeAccountCount: number;
  activeTrader: boolean;
  commissionSignal: string;
  status: NetworkNodeStatus;
};

export type NetworkNodeDetail = NetworkNodeRow & {
  firstSeenAt: string | null;
  latestEffectiveFrom: string | null;
  uplinks: NetworkNodeReference[];
  directReferralNodes: NetworkNodeReference[];
  subIbCount: number;
  linkedAccounts: NetworkLinkedAccountRef[];
  structureSummary: string;
  rebateRate: number | null;
  referralCode: string | null;
  referralLink: string | null;
  funnel: NetworkRebateFunnel;
  links: {
    userHref: string;
    accountsHref: string;
    commissionHref: string | null;
    financeHref: string;
  };
};

export type NetworkDrawerTab = "overview" | "relationship" | "signals" | "rebate" | "modules";

export type NetworkRebateFunnel = {
  invited: number;
  linked: number;
  qualified: number;
  converted: number;
  rejected: number;
  conversionRate: number;
};

export type NetworkNodeRebateContext = {
  rebateRate: number | null;
  referralCode: string | null;
  referralLink: string | null;
  funnel: NetworkRebateFunnel;
};

export type NetworkFilterControls = Pick<
  FilterBarBaseProps<NetworkFilters>,
  "inputFilters" | "setInputFilter" | "applyFilters" | "clearFilters"
>;
