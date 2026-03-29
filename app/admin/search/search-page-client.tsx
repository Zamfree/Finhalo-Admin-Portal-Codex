"use client";

import { useDeferredValue, useMemo } from "react";

import { formatTruncatedNumber } from "@/lib/money-display";
import { SearchEmptyState, SearchResultItem, SearchResultList, SearchResultPanel } from "./_shared";
import { filterSearchWorkspace } from "./_mappers";
import type { SearchWorkspaceData } from "./_types";

export function SearchPageClient({
  query,
  workspace,
}: {
  query: string;
  workspace: SearchWorkspaceData;
}) {
  const deferredQuery = useDeferredValue(query);
  const filteredWorkspace = useMemo(
    () => filterSearchWorkspace(workspace, deferredQuery),
    [workspace, deferredQuery]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SearchResultPanel
        title="Users"
        description="Identity-level matches across user identifiers and display names."
      >
        {filteredWorkspace.users.length ? (
          <SearchResultList>
            {filteredWorkspace.users.map((user) => (
              <SearchResultItem
                key={user.user_id}
                href={`/admin/users/${user.user_id}`}
                primary={user.display_name}
                secondary={`${user.user_id} | ${user.email}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="users" />
        )}
      </SearchResultPanel>

      <SearchResultPanel
        title="Trading Accounts"
        description="Account-level matches for operational investigation and cross-module handoff."
      >
        {filteredWorkspace.tradingAccounts.length ? (
          <SearchResultList>
            {filteredWorkspace.tradingAccounts.map((account) => (
              <SearchResultItem
                key={account.account_id}
                href={`/admin/accounts/${account.account_id}`}
                primary={account.account_number}
                secondary={`${account.account_id} | ${account.display_name} | ${account.user_id}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="trading accounts" />
        )}
      </SearchResultPanel>

      <SearchResultPanel
        title="Brokers"
        description="Broker-level matches for broker operations and import configuration follow-up."
      >
        {filteredWorkspace.brokers.length ? (
          <SearchResultList>
            {filteredWorkspace.brokers.map((broker) => (
              <SearchResultItem
                key={broker.broker_id}
                href={`/admin/brokers/${broker.broker_id}`}
                primary={broker.broker_name}
                secondary={`${broker.broker_id} | ${broker.status}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="brokers" />
        )}
      </SearchResultPanel>

      <SearchResultPanel
        title="Commission Batches"
        description="Batch-level matches for import review, validation follow-up, and settlement investigation."
      >
        {filteredWorkspace.commissionBatches.length ? (
          <SearchResultList>
            {filteredWorkspace.commissionBatches.map((batch) => (
              <SearchResultItem
                key={batch.batch_id}
                href={`/admin/commission/batches/${batch.batch_id}`}
                primary={batch.batch_id}
                secondary={`${batch.broker} | ${batch.status}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="commission batches" />
        )}
      </SearchResultPanel>

      <SearchResultPanel
        title="Campaigns"
        description="Campaign-level matches for operations and incentive program review."
      >
        {filteredWorkspace.campaigns.length ? (
          <SearchResultList>
            {filteredWorkspace.campaigns.map((campaign) => (
              <SearchResultItem
                key={campaign.campaign_id}
                href={`/admin/campaigns/${campaign.campaign_id}`}
                primary={campaign.name}
                secondary={`${campaign.campaign_id} | ${campaign.type} | ${campaign.status}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="campaigns" />
        )}
      </SearchResultPanel>

      <SearchResultPanel
        title="Withdrawals"
        description="Withdrawal-level matches for payout review and finance investigation."
      >
        {filteredWorkspace.withdrawals.length ? (
          <SearchResultList>
            {filteredWorkspace.withdrawals.map((withdrawal) => (
              <SearchResultItem
                key={withdrawal.withdrawal_id}
                href={
                  withdrawal.account_id
                    ? `/admin/finance/withdrawals?account_id=${encodeURIComponent(withdrawal.account_id)}`
                    : "/admin/finance/withdrawals"
                }
                primary={withdrawal.withdrawal_id}
                secondary={`${withdrawal.user_id} | ${withdrawal.beneficiary} | ${withdrawal.status} | ${formatTruncatedNumber(withdrawal.amount)}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="withdrawals" />
        )}
      </SearchResultPanel>

      <SearchResultPanel
        title="Support Tickets"
        description="Ticket-level matches for investigation and support handoff."
      >
        {filteredWorkspace.supportTickets.length ? (
          <SearchResultList>
            {filteredWorkspace.supportTickets.map((ticket) => (
              <SearchResultItem
                key={ticket.ticket_id}
                href={`/admin/support/${ticket.ticket_id}`}
                primary={ticket.subject}
                secondary={`${ticket.ticket_id} | ${ticket.user_id} | ${ticket.priority} | ${ticket.status}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="support tickets" />
        )}
      </SearchResultPanel>
    </div>
  );
}
