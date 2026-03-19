import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";

type SearchParams = {
  q?: string;
};

type UserResult = {
  user_id: string;
  email: string;
};

type TradingAccountResult = {
  account_id: string;
  account_number: string;
  user_id: string;
};

type CommissionBatchResult = {
  batch_id: string;
  broker: string;
  status: string;
};

type WithdrawalResult = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
};

type SearchPageProps = {
  searchParams: Promise<SearchParams>;
};

type RawRow = Record<string, unknown>;

function asNonEmptyString(value: unknown, fallback = "-"): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function includesQuery(query: string, values: Array<string | number | null | undefined>): boolean {
  const normalizedQuery = query.toLowerCase();

  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));
}


function canUseRouteParam(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== "-";
}

function normalizeUser(row: RawRow): UserResult | null {
  const userId = asNonEmptyString(row.user_id ?? row.id, "");

  if (!userId) {
    return null;
  }

  return {
    user_id: userId,
    email: asNonEmptyString(row.email ?? row.user_email),
  };
}

function normalizeTradingAccount(row: RawRow): TradingAccountResult | null {
  const accountId = asNonEmptyString(row.account_id ?? row.id, "");

  if (!accountId) {
    return null;
  }

  return {
    account_id: accountId,
    account_number: asNonEmptyString(row.account_number ?? row.login),
    user_id: asNonEmptyString(row.user_id ?? row.owner_user_id),
  };
}

function normalizeCommissionBatch(row: RawRow): CommissionBatchResult | null {
  const batchId = asNonEmptyString(row.batch_id ?? row.id, "");

  if (!batchId) {
    return null;
  }

  return {
    batch_id: batchId,
    broker: asNonEmptyString(row.broker ?? row.broker_name),
    status: asNonEmptyString(row.status),
  };
}

function normalizeWithdrawal(row: RawRow): WithdrawalResult | null {
  const withdrawalId = asNonEmptyString(row.id ?? row.withdrawal_id, "");

  if (!withdrawalId) {
    return null;
  }

  return {
    id: withdrawalId,
    user_id: asNonEmptyString(row.user_id ?? row.requester_user_id),
    amount: asNumber(row.amount ?? row.withdrawal_amount),
    status: asNonEmptyString(row.status),
  };
}

async function searchUsers(query: string) {
  const { data, error } = await supabaseServer.from("users").select("*").limit(200);

  if (error || !data) {
    return [];
  }

  return (data as RawRow[])
    .map((row) => normalizeUser(row))
    .filter((row): row is UserResult => row !== null)
    .filter((row) => includesQuery(query, [row.user_id, row.email]))
    .slice(0, 10);
}

async function searchTradingAccounts(query: string) {
  const { data, error } = await supabaseServer.from("trading_accounts").select("*").limit(200);

  if (error || !data) {
    return [];
  }

  return (data as RawRow[])
    .map((row) => normalizeTradingAccount(row))
    .filter((row): row is TradingAccountResult => row !== null)
    .filter((row) => includesQuery(query, [row.account_id, row.account_number, row.user_id]))
    .slice(0, 10);
}

async function searchCommissionBatches(query: string) {
  const { data, error } = await supabaseServer.from("commission_batches").select("*").limit(200);

  if (error || !data) {
    return [];
  }

  return (data as RawRow[])
    .map((row) => normalizeCommissionBatch(row))
    .filter((row): row is CommissionBatchResult => row !== null)
    .filter((row) => includesQuery(query, [row.batch_id, row.broker, row.status]))
    .slice(0, 10);
}

async function searchWithdrawals(query: string) {
  const { data, error } = await supabaseServer.from("withdrawals").select("*").limit(200);

  if (error || !data) {
    return [];
  }

  return (data as RawRow[])
    .map((row) => normalizeWithdrawal(row))
    .filter((row): row is WithdrawalResult => row !== null)
    .filter((row) => includesQuery(query, [row.id, row.user_id, row.status, row.amount]))
    .slice(0, 10);
}

export default async function AdminSearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const [users, tradingAccounts, commissionBatches, withdrawals] = query
    ? await Promise.all([
        searchUsers(query),
        searchTradingAccounts(query),
        searchCommissionBatches(query),
        searchWithdrawals(query),
      ])
    : [[], [], [], []];

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Global Search</h1>
        <form className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search users, accounts, batches, withdrawals"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm md:max-w-xl"
          />
          <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            Search
          </button>
        </form>
      </section>

      {query ? (
        <>
          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Users</h2>
            <ul className="space-y-2 text-sm">
              {users.map((user) => {
                const canLinkToUserDetail = canUseRouteParam(user.user_id);

                return (
                  <li key={user.user_id}>
                    {canLinkToUserDetail ? (
                      <Link href={`/admin/users/${user.user_id}`} className="text-primary hover:underline">
                        {user.user_id} — {user.email}
                      </Link>
                    ) : (
                      <span>
                        {user.user_id} — {user.email}
                      </span>
                    )}
                  </li>
                );
              })}
              {users.length === 0 ? <li className="text-muted-foreground">No users found.</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Trading Accounts</h2>
            <ul className="space-y-2 text-sm">
              {tradingAccounts.map((account) => (
                <li key={account.account_id}>
                  <span>
                    {account.account_number} (Account ID: {account.account_id})
                  </span>
                </li>
              ))}
              {tradingAccounts.length === 0 ? <li className="text-muted-foreground">No trading accounts found.</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Commission Batches</h2>
            <ul className="space-y-2 text-sm">
              {commissionBatches.map((batch) => {
                const canLinkToBatchDetail = canUseRouteParam(batch.batch_id);

                return (
                  <li key={batch.batch_id}>
                    {canLinkToBatchDetail ? (
                      <Link href={`/admin/commissions/${batch.batch_id}`} className="text-primary hover:underline">
                        {batch.batch_id} — {batch.broker} ({batch.status})
                      </Link>
                    ) : (
                      <span>
                        {batch.batch_id} — {batch.broker} ({batch.status})
                      </span>
                    )}
                  </li>
                );
              })}
              {commissionBatches.length === 0 ? (
                <li className="text-muted-foreground">No commission batches found.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Withdrawals</h2>
            <ul className="space-y-2 text-sm">
              {withdrawals.map((withdrawal) => (
                <li key={withdrawal.id}>
                  <span>
                    {withdrawal.id} — {withdrawal.user_id} ({withdrawal.status}, {withdrawal.amount.toLocaleString()})
                  </span>
                </li>
              ))}
              {withdrawals.length === 0 ? <li className="text-muted-foreground">No withdrawals found.</li> : null}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Enter a keyword to search across admin entities.</p>
      )}
    </div>
  );
}
