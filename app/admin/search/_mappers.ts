import type {
  SearchBrokerResult,
  SearchCampaignResult,
  SearchCommissionBatchResult,
  SearchSupportTicketResult,
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

function matchesBroker(broker: SearchBrokerResult, query: string) {
  return (
    broker.broker_id.toLowerCase().includes(query) ||
    broker.broker_name.toLowerCase().includes(query) ||
    broker.status.toLowerCase().includes(query)
  );
}

function matchesCampaign(campaign: SearchCampaignResult, query: string) {
  return (
    campaign.campaign_id.toLowerCase().includes(query) ||
    campaign.name.toLowerCase().includes(query) ||
    campaign.type.toLowerCase().includes(query) ||
    campaign.status.toLowerCase().includes(query)
  );
}

function matchesSupportTicket(ticket: SearchSupportTicketResult, query: string) {
  return (
    ticket.ticket_id.toLowerCase().includes(query) ||
    ticket.subject.toLowerCase().includes(query) ||
    ticket.user_id.toLowerCase().includes(query) ||
    ticket.priority.toLowerCase().includes(query) ||
    ticket.status.toLowerCase().includes(query)
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
    brokers: workspace.brokers.filter((broker) => matchesBroker(broker, normalizedQuery)),
    commissionBatches: workspace.commissionBatches.filter((batch) =>
      matchesBatch(batch, normalizedQuery)
    ),
    campaigns: workspace.campaigns.filter((campaign) =>
      matchesCampaign(campaign, normalizedQuery)
    ),
    withdrawals: workspace.withdrawals.filter((withdrawal) =>
      matchesWithdrawal(withdrawal, normalizedQuery)
    ),
    supportTickets: workspace.supportTickets.filter((ticket) =>
      matchesSupportTicket(ticket, normalizedQuery)
    ),
  };
}

export function getSearchWorkspaceSummary(
  workspace: SearchWorkspaceData
): SearchWorkspaceSummary {
  const userCount = workspace.users.length;
  const accountCount = workspace.tradingAccounts.length;
  const brokerCount = workspace.brokers.length;
  const batchCount = workspace.commissionBatches.length;
  const campaignCount = workspace.campaigns.length;
  const withdrawalCount = workspace.withdrawals.length;
  const supportTicketCount = workspace.supportTickets.length;

  return {
    totalResults:
      userCount +
      accountCount +
      brokerCount +
      batchCount +
      campaignCount +
      withdrawalCount +
      supportTicketCount,
    userCount,
    accountCount,
    brokerCount,
    batchCount,
    campaignCount,
    withdrawalCount,
    supportTicketCount,
  };
}
