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

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function getFieldScore(query: string, value: string, weight: number): number {
  const normalizedValue = normalizeSearchValue(value);

  if (!normalizedValue) {
    return 0;
  }

  if (normalizedValue === query) {
    return 100 * weight;
  }

  if (normalizedValue.startsWith(query)) {
    return 40 * weight;
  }

  if (normalizedValue.includes(query)) {
    return 10 * weight;
  }

  return 0;
}

function rankUserResult(query: string, row: UserResult): number {
  return getFieldScore(query, row.user_id, 4) + getFieldScore(query, row.email, 1);
}

function rankTradingAccountResult(query: string, row: TradingAccountResult): number {
  return (
    getFieldScore(query, row.account_number, 5) +
    getFieldScore(query, row.account_id, 3) +
    getFieldScore(query, row.user_id, 2)
  );
}

function rankCommissionBatchResult(query: string, row: CommissionBatchResult): number {
  return getFieldScore(query, row.batch_id, 5) + getFieldScore(query, row.broker, 2) + getFieldScore(query, row.status, 1);
}

function rankWithdrawalResult(query: string, row: WithdrawalResult): number {
  return getFieldScore(query, row.id, 5) + getFieldScore(query, row.user_id, 2) + getFieldScore(query, row.status, 1);
}

async function searchUsers(query: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .select("user_id,email")
    .or(`user_id.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const normalizedQuery = normalizeSearchValue(query);
  const rows = (data as UserResult[] | null) ?? [];

  return rows
    .map((row) => ({ row, score: rankUserResult(normalizedQuery, row) }))
    .sort((a, b) => b.score - a.score || a.row.user_id.localeCompare(b.row.user_id))
    .map((item) => item.row)
    .slice(0, 10);
}

async function searchTradingAccounts(query: string) {
  const { data, error } = await supabaseServer
    .from("trading_accounts")
    .select("account_id,account_number,user_id")
    .or(`account_id.ilike.%${query}%,account_number.ilike.%${query}%,user_id.ilike.%${query}%`)
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const normalizedQuery = normalizeSearchValue(query);
  const rows = (data as TradingAccountResult[] | null) ?? [];

  return rows
    .map((row) => ({ row, score: rankTradingAccountResult(normalizedQuery, row) }))
    .sort((a, b) => b.score - a.score || a.row.account_number.localeCompare(b.row.account_number))
    .map((item) => item.row)
    .slice(0, 10);
}

async function searchCommissionBatches(query: string) {
  const { data, error } = await supabaseServer
    .from("commission_batches")
    .select("batch_id,broker,status")
    .or(`batch_id.ilike.%${query}%,broker.ilike.%${query}%,status.ilike.%${query}%`)
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const normalizedQuery = normalizeSearchValue(query);
  const rows = (data as CommissionBatchResult[] | null) ?? [];

  return rows
    .map((row) => ({ row, score: rankCommissionBatchResult(normalizedQuery, row) }))
    .sort((a, b) => b.score - a.score || a.row.batch_id.localeCompare(b.row.batch_id))
    .map((item) => item.row)
    .slice(0, 10);
}

async function searchWithdrawals(query: string) {
  const { data, error } = await supabaseServer
    .from("withdrawals")
    .select("id,user_id,amount,status")
    .or(`id.ilike.%${query}%,user_id.ilike.%${query}%,status.ilike.%${query}%`)
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const normalizedQuery = normalizeSearchValue(query);
  const rows = (data as WithdrawalResult[] | null) ?? [];

  return rows
    .map((row) => ({ row, score: rankWithdrawalResult(normalizedQuery, row) }))
    .sort((a, b) => b.score - a.score || a.row.id.localeCompare(b.row.id))
    .map((item) => item.row)
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
              {users.map((user) => (
                <li key={user.user_id}>
                  <Link href={`/admin/users/${user.user_id}`} className="text-primary hover:underline">
                    {user.user_id} — {user.email}
                  </Link>
                </li>
              ))}
              {users.length === 0 ? <li className="text-muted-foreground">No users found.</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Trading Accounts</h2>
            <ul className="space-y-2 text-sm">
              {tradingAccounts.map((account) => (
                <li key={account.account_id}>
                  <Link href={`/admin/users/${account.user_id}`} className="text-primary hover:underline">
                    {account.account_number} (Account ID: {account.account_id})
                  </Link>
                </li>
              ))}
              {tradingAccounts.length === 0 ? <li className="text-muted-foreground">No trading accounts found.</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Commission Batches</h2>
            <ul className="space-y-2 text-sm">
              {commissionBatches.map((batch) => (
                <li key={batch.batch_id}>
                  <Link href={`/admin/commissions/${batch.batch_id}`} className="text-primary hover:underline">
                    {batch.batch_id} — {batch.broker} ({batch.status})
                  </Link>
                </li>
              ))}
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
                  <Link href={`/admin/finance/withdrawals?withdrawal_id=${withdrawal.id}`} className="text-primary hover:underline">
                    {withdrawal.id} — {withdrawal.user_id} ({withdrawal.status}, {withdrawal.amount.toLocaleString()})
                  </Link>
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
