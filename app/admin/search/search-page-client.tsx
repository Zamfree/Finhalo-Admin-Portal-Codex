"use client";

import { useDeferredValue, useMemo } from "react";

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
                secondary={`${user.user_id} · ${user.email}`}
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
                secondary={`${account.account_id} · ${account.display_name} · ${account.user_id}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="trading accounts" />
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
                secondary={`${batch.broker} · ${batch.status}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="commission batches" />
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
                href="/admin/finance/withdrawals"
                primary={withdrawal.withdrawal_id}
                secondary={`${withdrawal.user_id} · ${withdrawal.beneficiary} · ${withdrawal.status} · ${withdrawal.amount.toLocaleString()}`}
              />
            ))}
          </SearchResultList>
        ) : (
          <SearchEmptyState label="withdrawals" />
        )}
      </SearchResultPanel>
    </div>
  );
}
