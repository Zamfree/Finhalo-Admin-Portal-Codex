import type {
  NetworkNodeDetail,
  NetworkNodeReference,
  NetworkNodeRole,
  NetworkNodeRow,
  NetworkNodeStatus,
  NetworkNodeSummary,
  NetworkFilters,
  NetworkSnapshotRecord,
} from "./_types";
import type { NetworkParty } from "@/types/domain/network";

type MutableNode = {
  nodeId: string;
  displayName: string;
  email?: string;
  roles: Set<NetworkNodeRole>;
  linkedAccounts: Map<
    string,
    {
      accountId: string;
      accountCode: string;
      brokerName: string;
      snapshotId: string;
      snapshotStatus: NetworkNodeStatus;
    }
  >;
  activeAccountIds: Set<string>;
  uplinkIds: Set<string>;
  directReferralIds: Set<string>;
  firstSeenAt: string | null;
  latestEffectiveFrom: string | null;
  statusRank: number;
};

type WorkspaceData = {
  summary: NetworkNodeSummary;
  rows: NetworkNodeRow[];
  details: NetworkNodeDetail[];
};

const STATUS_RANK: Record<NetworkNodeStatus, number> = {
  inactive: 0,
  pending: 1,
  active: 2,
};

const STATUS_FROM_RANK: Record<number, NetworkNodeStatus> = {
  0: "inactive",
  1: "pending",
  2: "active",
};

function getEmailPrefix(email?: string) {
  return email?.split("@")[0]?.trim() ?? "";
}

function coalesceDate(current: string | null, next: string, mode: "min" | "max") {
  if (!current) {
    return next;
  }

  const currentTime = new Date(current).getTime();
  const nextTime = new Date(next).getTime();

  if (mode === "min") {
    return nextTime < currentTime ? next : current;
  }

  return nextTime > currentTime ? next : current;
}

function getPrimaryRole(roles: Set<NetworkNodeRole>): NetworkNodeRole {
  if (roles.has("l2")) {
    return "l2";
  }

  if (roles.has("l1")) {
    return "l1";
  }

  return "trader";
}

function formatRoleLabel(role: NetworkNodeRole) {
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

function getNodeStatus(rank: number): NetworkNodeStatus {
  return STATUS_FROM_RANK[Math.max(0, Math.min(2, rank))] ?? "inactive";
}

function createEmptyNode(nodeId: string, displayName: string, email?: string): MutableNode {
  return {
    nodeId,
    displayName,
    email,
    roles: new Set<NetworkNodeRole>(),
    linkedAccounts: new Map(),
    activeAccountIds: new Set(),
    uplinkIds: new Set(),
    directReferralIds: new Set(),
    firstSeenAt: null,
    latestEffectiveFrom: null,
    statusRank: 0,
  };
}

function ensureNode(
  nodes: Map<string, MutableNode>,
  nodeId: string,
  displayName: string,
  email?: string
) {
  const existing = nodes.get(nodeId);
  if (existing) {
    if (!existing.displayName && displayName) {
      existing.displayName = displayName;
    }
    if (!existing.email && email) {
      existing.email = email;
    }
    return existing;
  }

  const nextNode = createEmptyNode(nodeId, displayName, email);
  nodes.set(nodeId, nextNode);
  return nextNode;
}

export function getNetworkPartyDisplayName(party?: Partial<NetworkParty> | null) {
  if (!party) {
    return "—";
  }

  if (party.displayName && party.displayName.trim().length > 0) {
    return party.displayName.trim();
  }

  const emailPrefix = getEmailPrefix(party.email);
  if (emailPrefix) {
    return emailPrefix;
  }

  return party.userId ?? "—";
}

function getDisplayNameForSnapshotRole(
  snapshot: NetworkSnapshotRecord,
  role: NetworkNodeRole
) {
  if (role === "trader") {
    return snapshot.traderDisplayName ?? getNetworkPartyDisplayName(snapshot.trader);
  }

  if (role === "l1") {
    return snapshot.l1DisplayName ?? getNetworkPartyDisplayName(snapshot.l1);
  }

  return snapshot.l2DisplayName ?? getNetworkPartyDisplayName(snapshot.l2);
}

function getEmailForSnapshotRole(snapshot: NetworkSnapshotRecord, role: NetworkNodeRole) {
  if (role === "trader") {
    return snapshot.trader.email;
  }

  if (role === "l1") {
    return snapshot.l1?.email;
  }

  return snapshot.l2?.email;
}

function registerSnapshotNode(
  nodes: Map<string, MutableNode>,
  snapshot: NetworkSnapshotRecord,
  role: NetworkNodeRole,
  nodeId: string,
  uplinkId?: string | null,
  directReferralId?: string | null
) {
  const node = ensureNode(
    nodes,
    nodeId,
    getDisplayNameForSnapshotRole(snapshot, role),
    getEmailForSnapshotRole(snapshot, role)
  );

  node.roles.add(role);
  node.linkedAccounts.set(snapshot.accountId, {
    accountId: snapshot.accountId,
    accountCode: snapshot.accountCode,
    brokerName: snapshot.brokerName,
    snapshotId: snapshot.snapshotId,
    snapshotStatus: snapshot.snapshotStatus,
  });

  if (snapshot.snapshotStatus === "active") {
    node.activeAccountIds.add(snapshot.accountId);
  }

  node.statusRank = Math.max(node.statusRank, STATUS_RANK[snapshot.snapshotStatus]);
  node.firstSeenAt = coalesceDate(node.firstSeenAt, snapshot.createdAt, "min");
  node.latestEffectiveFrom = coalesceDate(
    node.latestEffectiveFrom,
    snapshot.effectiveFrom,
    "max"
  );

  if (uplinkId) {
    node.uplinkIds.add(uplinkId);
  }

  if (directReferralId) {
    node.directReferralIds.add(directReferralId);
  }
}

function createReference(
  nodeId: string,
  nodes: Map<string, MutableNode>
): NetworkNodeReference | null {
  const node = nodes.get(nodeId);
  if (!node) {
    return null;
  }

  return {
    nodeId,
    displayName: node.displayName,
    email: node.email,
    primaryRole: getPrimaryRole(node.roles),
  };
}

function buildDescendantCount(
  nodeId: string,
  childMap: Map<string, Set<string>>,
  visiting = new Set<string>()
): number {
  if (visiting.has(nodeId)) {
    return 0;
  }

  visiting.add(nodeId);
  const children = childMap.get(nodeId);

  if (!children || children.size === 0) {
    visiting.delete(nodeId);
    return 0;
  }

  const descendants = new Set<string>();

  for (const childId of children) {
    descendants.add(childId);
    const grandChildren = childMap.get(childId);
    if (grandChildren?.size) {
      for (const nestedId of collectDescendants(childId, childMap, new Set(visiting))) {
        descendants.add(nestedId);
      }
    }
  }

  visiting.delete(nodeId);
  return descendants.size;
}

function collectDescendants(
  nodeId: string,
  childMap: Map<string, Set<string>>,
  visiting = new Set<string>()
): Set<string> {
  if (visiting.has(nodeId)) {
    return new Set();
  }

  visiting.add(nodeId);
  const result = new Set<string>();
  const children = childMap.get(nodeId);

  if (!children) {
    return result;
  }

  for (const childId of children) {
    result.add(childId);
    for (const nestedId of collectDescendants(childId, childMap, new Set(visiting))) {
      result.add(nestedId);
    }
  }

  return result;
}

function getUplinkLabel(node: MutableNode, nodes: Map<string, MutableNode>) {
  if (node.uplinkIds.size === 0) {
    return "—";
  }

  if (node.uplinkIds.size === 1) {
    const [uplinkId] = Array.from(node.uplinkIds);
    return nodes.get(uplinkId)?.displayName ?? uplinkId;
  }

  return `${node.uplinkIds.size} uplinks`;
}

function getCommissionSignal(node: MutableNode) {
  if (node.activeAccountIds.size > 1) {
    return `${node.activeAccountIds.size} active linked accounts`;
  }

  if (node.activeAccountIds.size === 1) {
    return "1 active linked account";
  }

  if (node.linkedAccounts.size > 0) {
    return "No live activity";
  }

  return "No linked accounts";
}

export function buildNetworkWorkspace(snapshots: NetworkSnapshotRecord[]): WorkspaceData {
  const currentSnapshots = snapshots.filter((snapshot) => snapshot.isCurrent);
  const nodes = new Map<string, MutableNode>();
  const childMap = new Map<string, Set<string>>();

  for (const snapshot of currentSnapshots) {
    registerSnapshotNode(nodes, snapshot, "trader", snapshot.traderId, snapshot.l1Id ?? null);

    if (snapshot.l1Id) {
      registerSnapshotNode(
        nodes,
        snapshot,
        "l1",
        snapshot.l1Id,
        snapshot.l2Id ?? null,
        snapshot.traderId
      );

      if (!childMap.has(snapshot.l1Id)) {
        childMap.set(snapshot.l1Id, new Set());
      }
      childMap.get(snapshot.l1Id)?.add(snapshot.traderId);
    }

    if (snapshot.l2Id) {
      registerSnapshotNode(nodes, snapshot, "l2", snapshot.l2Id, null, snapshot.l1Id ?? null);

      if (snapshot.l1Id) {
        if (!childMap.has(snapshot.l2Id)) {
          childMap.set(snapshot.l2Id, new Set());
        }
        childMap.get(snapshot.l2Id)?.add(snapshot.l1Id);
      }
    }
  }

  const rows: NetworkNodeRow[] = Array.from(nodes.values())
    .map((node) => {
      const roles = Array.from(node.roles).sort((left, right) => {
        const order: Record<NetworkNodeRole, number> = { l2: 0, l1: 1, trader: 2 };
        return order[left] - order[right];
      });

      return {
        nodeId: node.nodeId,
        displayName: node.displayName,
        email: node.email,
        primaryRole: getPrimaryRole(node.roles),
        roles,
        uplinkLabel: getUplinkLabel(node, nodes),
        uplinkCount: node.uplinkIds.size,
        directReferrals: node.directReferralIds.size,
        totalDownline: buildDescendantCount(node.nodeId, childMap),
        linkedAccountsCount: node.linkedAccounts.size,
        activeAccountCount: node.activeAccountIds.size,
        activeTrader: node.roles.has("trader") && node.activeAccountIds.size > 0,
        commissionSignal: getCommissionSignal(node),
        status: getNodeStatus(node.statusRank),
      };
    })
    .sort((left, right) => {
      if (left.totalDownline !== right.totalDownline) {
        return right.totalDownline - left.totalDownline;
      }

      if (left.directReferrals !== right.directReferrals) {
        return right.directReferrals - left.directReferrals;
      }

      return left.displayName.localeCompare(right.displayName);
    });

  const details: NetworkNodeDetail[] = rows.map((row) => {
    const node = nodes.get(row.nodeId)!;
    const uplinks = Array.from(node.uplinkIds)
      .map((nodeId) => createReference(nodeId, nodes))
      .filter((item): item is NetworkNodeReference => Boolean(item))
      .sort((left, right) => left.displayName.localeCompare(right.displayName));

    const directReferralNodes = Array.from(node.directReferralIds)
      .map((nodeId) => createReference(nodeId, nodes))
      .filter((item): item is NetworkNodeReference => Boolean(item))
      .sort((left, right) => left.displayName.localeCompare(right.displayName));

    const linkedAccounts = Array.from(node.linkedAccounts.values()).sort((left, right) =>
      left.accountCode.localeCompare(right.accountCode)
    );

    return {
      ...row,
      firstSeenAt: node.firstSeenAt,
      latestEffectiveFrom: node.latestEffectiveFrom,
      uplinks,
      directReferralNodes,
      subIbCount: directReferralNodes.filter((item) => item.primaryRole === "l1").length,
      linkedAccounts,
      structureSummary: rolesToSummary(row.roles),
      links: {
        userHref: `/admin/users/${encodeURIComponent(row.nodeId)}`,
        accountsHref: `/admin/accounts?query=${encodeURIComponent(row.nodeId)}`,
        commissionHref: linkedAccounts[0]
          ? `/admin/commission?account_id=${encodeURIComponent(linkedAccounts[0].accountId)}`
          : null,
        financeHref: linkedAccounts[0]
          ? `/admin/finance/ledger?query=${encodeURIComponent(linkedAccounts[0].accountId)}`
          : "/admin/finance",
      },
    };
  });

  const summary: NetworkNodeSummary = {
    totalNodes: rows.length,
    activeIbs: rows.filter(
      (row) => (row.roles.includes("l1") || row.roles.includes("l2")) && row.status === "active"
    ).length,
    totalDownlines: rows.filter((row) => row.uplinkCount > 0).length,
    activeTraders: rows.filter((row) => row.activeTrader).length,
  };

  return {
    summary,
    rows,
    details,
  };
}

function rolesToSummary(roles: NetworkNodeRole[]) {
  if (roles.length === 0) {
    return "No current network role";
  }

  return roles.map(formatRoleLabel).join(" / ");
}

export function filterNetworkNodeRows(
  rows: NetworkNodeRow[],
  filters: NetworkFilters
): NetworkNodeRow[] {
  const query = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesQuery =
      !query ||
      row.nodeId.toLowerCase().includes(query) ||
      row.displayName.toLowerCase().includes(query) ||
      row.email?.toLowerCase().includes(query) ||
      row.uplinkLabel.toLowerCase().includes(query);

    const matchesStatus = filters.status === "all" || row.status === filters.status;

    return matchesQuery && matchesStatus;
  });
}
