import type { AccountFilters, TradingAccountRecord } from "./_types";

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function matchesAccountQuery(row: TradingAccountRecord, query: string) {
  if (!query) return true;

  return (
    row.account_id.toLowerCase().includes(query) ||
    row.user_display_name.toLowerCase().includes(query) ||
    row.user_email.toLowerCase().includes(query) ||
    row.user_id.toLowerCase().includes(query) ||
    row.trader_display_name.toLowerCase().includes(query) ||
    row.trader_user_id.toLowerCase().includes(query) ||
    row.relationship_snapshot_id.toLowerCase().includes(query) ||
    row.l1_ib_display_name?.toLowerCase().includes(query) ||
    row.l1_ib_id?.toLowerCase().includes(query) ||
    row.l2_ib_display_name?.toLowerCase().includes(query) ||
    row.l2_ib_id?.toLowerCase().includes(query)
  );
}
export function filterAccountRows(
  rows: TradingAccountRecord[],
  filters: AccountFilters
) {
  const normalizedQuery = normalizeSearchValue(filters.query);

  return rows.filter((row) => {
    const matchesQuery = matchesAccountQuery(row, normalizedQuery);

    const matchesBroker =
      filters.broker === "all" || row.broker === filters.broker;

    const matchesStatus =
      filters.status === "all" || row.status === filters.status;

    return matchesQuery && matchesBroker && matchesStatus;
  });
}
