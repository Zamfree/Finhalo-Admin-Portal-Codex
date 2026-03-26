import type {
  SearchCommissionBatchResult,
  SearchTradingAccountResult,
  SearchUserResult,
  SearchWithdrawalResult,
  SearchWorkspaceData,
  SearchWorkspaceSummary,
} from "./_types";

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function matchesUser(user: SearchUserResult, query: string) {
  return (
    user.user_id.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    user.display_name.toLowerCase().includes(query)
  );
}

function matchesAccount(account: SearchTradingAccountResult, query: string) {
  return (
    account.account_id.toLowerCase().includes(query) ||
    account.account_number.toLowerCase().includes(query) ||
    account.user_id.toLowerCase().includes(query) ||
    account.display_name.toLowerCase().includes(query)
  );
}

function matchesBatch(batch: SearchCommissionBatchResult, query: string) {
  return (
    batch.batch_id.toLowerCase().includes(query) ||
    batch.broker.toLowerCase().includes(query) ||
    batch.status.toLowerCase().includes(query)
  );
}

function matchesWithdrawal(withdrawal: SearchWithdrawalResult, query: string) {
  return (
    withdrawal.withdrawal_id.toLowerCase().includes(query) ||
    withdrawal.user_id.toLowerCase().includes(query) ||
    withdrawal.beneficiary.toLowerCase().includes(query) ||
    withdrawal.status.toLowerCase().includes(query) ||
    withdrawal.amount.toString().includes(query)
  );
}

export function filterSearchWorkspace(
  workspace: SearchWorkspaceData,
  query: string
): SearchWorkspaceData {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return workspace;
  }

  return {
    users: workspace.users.filter((user) => matchesUser(user, normalizedQuery)),
    tradingAccounts: workspace.tradingAccounts.filter((account) =>
      matchesAccount(account, normalizedQuery)
    ),
    commissionBatches: workspace.commissionBatches.filter((batch) =>
      matchesBatch(batch, normalizedQuery)
    ),
    withdrawals: workspace.withdrawals.filter((withdrawal) =>
      matchesWithdrawal(withdrawal, normalizedQuery)
    ),
  };
}

export function getSearchWorkspaceSummary(
  workspace: SearchWorkspaceData
): SearchWorkspaceSummary {
  const userCount = workspace.users.length;
  const accountCount = workspace.tradingAccounts.length;
  const batchCount = workspace.commissionBatches.length;
  const withdrawalCount = workspace.withdrawals.length;

  return {
    totalResults: userCount + accountCount + batchCount + withdrawalCount,
    userCount,
    accountCount,
    batchCount,
    withdrawalCount,
  };
}
