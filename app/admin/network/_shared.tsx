import Link from "next/link";
import type { DataTableColumn } from "@/components/system/data/data-table";
import type {
  NetworkAccountRelationshipRow,
  NetworkDrawerTab,
  NetworkIbStatsRow,
  NetworkNodeDetail,
  NetworkNodeRole,
  NetworkNodeRow,
} from "./_types";

export function getNetworkNodeColumns(): DataTableColumn<NetworkNodeRow>[] {
  return [
    {
      key: "identity",
      header: "Identity",
      cell: (row) => (
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{row.displayName}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{row.nodeId}</span>
            {row.email ? <span>{row.email}</span> : null}
          </div>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "25%",
    },
    {
      key: "uplink",
      header: "Uplink",
      cell: (row) => (
        <div className="space-y-1">
          <p className="text-sm text-zinc-200">{row.uplinkLabel}</p>
          <p className="text-xs text-zinc-500">
            {row.uplinkCount > 1 ? `${row.uplinkCount} current uplinks` : "Current parent context"}
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "20%",
    },
    {
      key: "network",
      header: "Network",
      cell: (row) => (
        <div className="space-y-1">
          <p className="text-sm text-white">
            {row.directReferrals} direct referrals
          </p>
          <p className="text-xs text-zinc-500">{row.totalDownline} total downline</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "18%",
    },
    {
      key: "signal",
      header: "Signal",
      cell: (row) => (
        <div className="space-y-1">
          <p className="text-sm text-zinc-200">
            {row.linkedAccountsCount} linked accounts
          </p>
          <p className="text-xs text-zinc-500">
            {row.activeTrader ? "Active trader signal" : row.commissionSignal}
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "20%",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getNodeStatusClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-3 pr-0",
      width: "17%",
    },
  ];
}

export function getNetworkIbStatsColumns(): DataTableColumn<NetworkIbStatsRow>[] {
  return [
    {
      key: "identity",
      header: "IB Node",
      cell: (row) => (
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{row.displayName}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{row.ibUserId}</span>
            <span>{formatIbRole(row.role)}</span>
          </div>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "30%",
    },
    {
      key: "coverage",
      header: "Coverage",
      cell: (row) => (
        <div className="space-y-1 text-sm text-zinc-200">
          <p>{row.directReferrals} direct referrals</p>
          <p className="text-xs text-zinc-500">{row.totalDownline} total downline</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "25%",
    },
    {
      key: "accounts",
      header: "Linked Accounts",
      cell: (row) => (
        <div className="space-y-1 text-sm text-zinc-200">
          <p>{row.linkedAccountsCount} linked</p>
          <p className="text-xs text-zinc-500">{row.activeAccountCount} active</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "25%",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getNodeStatusClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-3 pr-0",
      width: "20%",
    },
  ];
}

export function getNetworkRelationshipColumns(): DataTableColumn<NetworkAccountRelationshipRow>[] {
  return [
    {
      key: "account",
      header: "Account",
      cell: (row) => (
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{row.accountCode}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{row.accountId}</span>
            <span>{row.brokerName}</span>
          </div>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "26%",
    },
    {
      key: "relationship",
      header: "Relationship",
      cell: (row) => (
        <div className="space-y-1 text-sm text-zinc-200">
          <p>Trader: {row.traderLabel}</p>
          <p className="text-xs text-zinc-500">L1: {row.l1Label}</p>
          <p className="text-xs text-zinc-500">L2: {row.l2Label}</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "36%",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getNodeStatusClass(
            row.snapshotStatus
          )}`}
        >
          {row.snapshotStatus}
        </span>
      ),
      cellClassName: "py-3 pr-4",
      width: "14%",
    },
    {
      key: "effective",
      header: "Effective From",
      cell: (row) => (
        <div className="space-y-1 text-sm text-zinc-300">
          <p>{new Date(row.effectiveFrom).toLocaleString()}</p>
          <p className="text-xs text-zinc-500">Updated {new Date(row.updatedAt).toLocaleString()}</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "20%",
    },
    {
      key: "open",
      header: "Open",
      cell: (row) => (
        <Link
          href={`/admin/accounts/${encodeURIComponent(row.accountId)}?snapshot_id=${encodeURIComponent(
            row.snapshotId
          )}`}
          className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-300 hover:text-sky-200"
        >
          Account
        </Link>
      ),
      cellClassName: "py-3 pr-0",
      width: "8%",
    },
  ];
}

export function formatRoleLabel(role: NetworkNodeRole) {
  switch (role) {
    case "trader":
      return "Trader";
    case "l1":
      return "L1 IB";
    case "l2":
      return "L2 IB";
    default:
      return role;
  }
}

function formatIbRole(role: NetworkIbStatsRow["role"]) {
  if (role === "l1") {
    return "L1 IB";
  }

  if (role === "l2") {
    return "L2 IB";
  }

  return "L1 + L2 IB";
}

export function getNodeStatusClass(status: NetworkNodeRow["status"]) {
  if (status === "active") {
    return "bg-emerald-500/10 text-emerald-300";
  }

  if (status === "pending") {
    return "bg-amber-500/10 text-amber-300";
  }

  return "bg-zinc-500/10 text-zinc-300";
}

export function getNetworkDrawerTabLabel(tab: NetworkDrawerTab) {
  switch (tab) {
    case "overview":
      return "Overview";
    case "relationship":
      return "Relationship";
    case "signals":
      return "Signals";
    case "rebate":
      return "Rebate";
    default:
      return tab;
  }
}

export function roleSummary(detail: NetworkNodeDetail) {
  return detail.roles.map(formatRoleLabel).join(" / ");
}
