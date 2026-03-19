import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

async function searchUsers(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("user_id,email")
    .or(`user_id.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  return (data as UserResult[] | null) ?? [];
}

async function searchTradingAccounts(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trading_accounts")
    .select("account_id,account_number,user_id")
    .or(`account_id.ilike.%${query}%,account_number.ilike.%${query}%,user_id.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching trading accounts:", error);
    return [];
  }

  return (data as TradingAccountResult[] | null) ?? [];
}

async function searchCommissionBatches(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commission_batches")
    .select("batch_id,broker,status")
    .or(`batch_id.ilike.%${query}%,broker.ilike.%${query}%,status.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching commission batches:", error);
    return [];
  }

  return (data as CommissionBatchResult[] | null) ?? [];
}

async function searchWithdrawals(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("withdrawals")
    .select("id,user_id,amount,status")
    .or(`id.ilike.%${query}%,user_id.ilike.%${query}%,status.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching withdrawals:", error);
    return [];
  }

  return (data as WithdrawalResult[] | null) ?? [];
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
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Global Search</h1>
          {query && (
            <Link
              href="/admin/search"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>
        <form className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search users, accounts, batches, withdrawals"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm md:max-w-xl focus:ring-1 focus:ring-primary outline-none"
          />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Search
          </button>
        </form>
      </section>

      {query ? (
        <div className="space-y-4">
          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wider text-xs">Users ({users.length})</h2>
            <ul className="divide-y text-sm">
              {users.map((user) => (
                <li key={user.user_id} className="py-2">
                  <Link href={`/admin/users/${user.user_id}`} className="block group">
                    <span className="font-medium text-foreground group-hover:text-primary group-hover:underline">{user.email}</span>
                    <span className="ml-2 text-xs text-muted-foreground font-mono">ID: {user.user_id}</span>
                  </Link>
                </li>
              ))}
              {users.length === 0 ? <li className="py-2 text-muted-foreground italic">No users found matching "{query}"</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wider text-xs">Trading Accounts ({tradingAccounts.length})</h2>
            <ul className="divide-y text-sm">
              {tradingAccounts.map((account) => (
                <li key={account.account_id} className="py-2">
                  <Link href={`/admin/users/${account.user_id}`} className="block group">
                    <span className="font-mono font-medium text-foreground group-hover:text-primary group-hover:underline">#{account.account_number}</span>
                    <span className="ml-2 text-xs text-muted-foreground">Owner: {account.user_id}</span>
                  </Link>
                </li>
              ))}
              {tradingAccounts.length === 0 ? <li className="py-2 text-muted-foreground italic">No trading accounts found.</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wider text-xs">Commission Batches ({commissionBatches.length})</h2>
            <ul className="divide-y text-sm">
              {commissionBatches.map((batch) => (
                <li key={batch.batch_id} className="py-2">
                  <Link href={`/admin/commissions/${batch.batch_id}`} className="block group">
                    <span className="font-medium text-foreground group-hover:text-primary group-hover:underline">{batch.broker}</span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-medium uppercase">{batch.status}</span>
                    <span className="ml-2 text-xs text-muted-foreground font-mono">ID: {batch.batch_id}</span>
                  </Link>
                </li>
              ))}
              {commissionBatches.length === 0 ? (
                <li className="py-2 text-muted-foreground italic">No commission batches found.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wider text-xs">Withdrawals ({withdrawals.length})</h2>
            <ul className="divide-y text-sm">
              {withdrawals.map((withdrawal) => (
                <li key={withdrawal.id} className="py-2">
                  <Link href={`/admin/finance?user_id=${withdrawal.user_id}`} className="block group">
                    <span className="font-medium text-foreground group-hover:text-primary group-hover:underline">${(withdrawal.amount ?? 0).toLocaleString()}</span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-medium uppercase">{withdrawal.status}</span>
                    <span className="ml-2 text-xs text-muted-foreground">User: {withdrawal.user_id}</span>
                  </Link>
                </li>
              ))}
              {withdrawals.length === 0 ? <li className="py-2 text-muted-foreground italic">No withdrawals found.</li> : null}
            </ul>
          </section>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Enter a keyword above to search across users, accounts, batches, and withdrawals.</p>
          <p className="text-xs text-muted-foreground mt-1 italic">Results are limited to the top 10 matches per category.</p>
        </div>
      )}
    </div>
  );
}
