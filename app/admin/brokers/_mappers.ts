import type { BrokerFilters, BrokerListRow, BrokerSummaryStats } from "./_types";

export function getBrokerSummaryStats(rows: BrokerListRow[]): BrokerSummaryStats {
  return {
    totalBrokers: rows.length,
    activeBrokers: rows.filter((broker) => broker.status === "active").length,
    inactiveBrokers: rows.filter((broker) => broker.status === "inactive").length,
    totalLinkedAccounts: rows.reduce((sum, broker) => sum + broker.accounts, 0),
  };
}
export function filterBrokerRows(
  rows: BrokerListRow[],
  filters: BrokerFilters
): BrokerListRow[] {
  const keyword = filters.broker_query.trim().toLowerCase();

  return rows.filter((broker) => {
    const matchesBrokerQuery =
      !keyword ||
      broker.broker_name.toLowerCase().includes(keyword) ||
      broker.broker_id.toLowerCase().includes(keyword);

    const matchesStatus =
      filters.status === "all" || broker.status === filters.status;

    return matchesBrokerQuery && matchesStatus;
  });
}

export function paginateBrokerRows(
  rows: BrokerListRow[],
  currentPage: number,
  pageSize: number
) {
  const total = rows.length;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedRows = rows.slice(startIndex, endIndex);

  const visibleFrom = total === 0 ? 0 : startIndex + 1;
  const visibleTo = Math.min(endIndex, total);

  return {
    total,
    totalPages,
    safeCurrentPage,
    paginatedRows,
    visibleFrom,
    visibleTo,
  };
}
