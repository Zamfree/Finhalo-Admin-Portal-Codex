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
    console.error("Search Users Error:", error);
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
    console.error("Search Accounts Error:", error);
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
    console.error("Search Batches Error:", error);
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
    console.error("Search Withdrawals Error:", error);
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

  const hasAnyResults = users.length > 0 || tradingAccounts.length > 0 || commissionBatches.length > 0 || withdrawals.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-background p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-bold tracking-tight">Global Investigation Search</h1>
        <p className="mb-6 text-sm text-muted-foreground">Search across users, accounts, batches, and withdrawals to start an investigation.</p>

        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xl">
            <input
              name="q"
              defaultValue={query}
              autoFocus
              placeholder="Enter ID, email, account number, or status..."
              className="w-full rounded-md border bg-background px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-shadow"
            />
            {query && (
              <Link
                href="/admin/search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                Clear
              </Link>
            )}
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </form>
      </section>

      {query ? (
        <div className="grid gap-6">
          {!hasAnyResults && (
            <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
              <h3 className="text-lg font-semibold">No direct matches found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Try searching for a partial ID, a different keyword, or check the specific module lists for broader filtering.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/admin/users" className="text-xs font-medium text-primary hover:underline">Users List</Link>
                <Link href="/admin/finance" className="text-xs font-medium text-primary hover:underline">Finance Ledger</Link>
                <Link href="/admin/commissions" className="text-xs font-medium text-primary hover:underline">Commission Batches</Link>
              </div>
            </div>
          )}

          {users.length > 0 && (
            <section className="rounded-lg border bg-background p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Users ({users.length})</h2>
                <span className="text-[10px] italic text-muted-foreground">Profile Investigation</span>
              </div>
              <ul className="divide-y text-sm">
                {users.map((user) => (
                  <li key={user.user_id} className="py-3 last:pb-0">
                    <Link href={`/admin/users/${user.user_id}`} className="group flex items-center justify-between hover:text-primary transition-colors">
                      <div className="flex flex-col">
                        <span className="font-medium group-hover:underline">{user.email}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{user.user_id}</span>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-primary">View Profile →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tradingAccounts.length > 0 && (
            <section className="rounded-lg border bg-background p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Trading Accounts ({tradingAccounts.length})</h2>
                <span className="text-[10px] italic text-muted-foreground">Account Owner Investigation</span>
              </div>
              <ul className="divide-y text-sm">
                {tradingAccounts.map((account) => (
                  <li key={account.account_id} className="py-3 last:pb-0">
                    <Link href={`/admin/users/${account.user_id}`} className="group flex items-center justify-between hover:text-primary transition-colors">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium group-hover:underline">{account.account_number}</span>
                        <span className="text-[10px] text-muted-foreground">Owner: {account.user_id}</span>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-primary">Investigate Owner →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {commissionBatches.length > 0 && (
            <section className="rounded-lg border bg-background p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Commission Batches ({commissionBatches.length})</h2>
                <span className="text-[10px] italic text-muted-foreground">Commission Source Investigation</span>
              </div>
              <ul className="divide-y text-sm">
                {commissionBatches.map((batch) => (
                  <li key={batch.batch_id} className="py-3 last:pb-0">
                    <Link href={`/admin/commissions/${batch.batch_id}`} className="group flex items-center justify-between hover:text-primary transition-colors">
                      <div className="flex flex-col">
                        <span className="font-medium group-hover:underline">{batch.broker}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{batch.batch_id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                          {batch.status}
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-primary">View Batch →</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {withdrawals.length > 0 && (
            <section className="rounded-lg border bg-background p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Withdrawals ({withdrawals.length})</h2>
                <span className="text-[10px] italic text-muted-foreground">Finance Investigation</span>
              </div>
              <ul className="divide-y text-sm">
                {withdrawals.map((withdrawal) => (
                  <li key={withdrawal.id} className="py-3 last:pb-0">
                    <Link href={`/admin/finance?user_id=${withdrawal.user_id}&transaction_type=withdrawal`} className="group flex items-center justify-between hover:text-primary transition-colors">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium group-hover:underline">Withdrawal {withdrawal.id}</span>
                        <span className="text-[10px] text-muted-foreground">User: {withdrawal.user_id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-medium text-red-600">
                          {Number(withdrawal.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                          {withdrawal.status}
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-primary">View Ledger →</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <section className="rounded-lg border bg-background p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <span className="text-xl">🔍</span>
          </div>
          <h2 className="mt-4 text-lg font-semibold">Ready to investigate?</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Enter a keyword above to search across all primary admin modules and find the entities you need.
          </p>
        </section>
      )}
    </div>
  );
}
