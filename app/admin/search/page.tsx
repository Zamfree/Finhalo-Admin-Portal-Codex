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

function asDisplayText(value: unknown, fallback = "-"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "open":
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "closed":
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

async function searchUsers(query: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .select("user_id,email")
    .or(`user_id.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserResult[] | null) ?? [];
}

async function searchTradingAccounts(query: string) {
  const { data, error } = await supabaseServer
    .from("trading_accounts")
    .select("account_id,account_number,user_id")
    .or(`account_id.ilike.%${query}%,account_number.ilike.%${query}%,user_id.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data as TradingAccountResult[] | null) ?? [];
}

async function searchCommissionBatches(query: string) {
  const { data, error } = await supabaseServer
    .from("commission_batches")
    .select("batch_id,broker,status")
    .or(`batch_id.ilike.%${query}%,broker.ilike.%${query}%,status.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data as CommissionBatchResult[] | null) ?? [];
}

async function searchWithdrawals(query: string) {
  const { data, error } = await supabaseServer
    .from("withdrawals")
    .select("id,user_id,amount,status")
    .or(`id.ilike.%${query}%,user_id.ilike.%${query}%,status.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(error.message);
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
            <h2 className="mb-3 text-base font-semibold">Users ({users.length})</h2>
            <ul className="space-y-2 text-sm">
              {users.map((user) => (
                <li key={user.user_id}>
                  <Link href={`/admin/users/${user.user_id}`} className="text-primary hover:underline">
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs">USER</span>
                    <span>{asDisplayText(user.user_id)}</span>
                    <span className="text-muted-foreground"> · {asDisplayText(user.email)}</span>
                  </Link>
                </li>
              ))}
              {users.length === 0 ? <li className="text-muted-foreground">No users found.</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Trading Accounts ({tradingAccounts.length})</h2>
            <ul className="space-y-2 text-sm">
              {tradingAccounts.map((account) => (
                <li key={account.account_id}>
                  <Link href={`/admin/users/${account.user_id}`} className="text-primary hover:underline">
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs">ACCOUNT</span>
                    <span>{asDisplayText(account.account_number)}</span>
                    <span className="text-muted-foreground"> · ID {asDisplayText(account.account_id)}</span>
                    <span className="text-muted-foreground"> · User {asDisplayText(account.user_id)}</span>
                  </Link>
                </li>
              ))}
              {tradingAccounts.length === 0 ? <li className="text-muted-foreground">No trading accounts found.</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Commission Batches ({commissionBatches.length})</h2>
            <ul className="space-y-2 text-sm">
              {commissionBatches.map((batch) => (
                <li key={batch.batch_id}>
                  <Link href={`/admin/commissions/${batch.batch_id}`} className="text-primary hover:underline">
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs">BATCH</span>
                    <span>{asDisplayText(batch.batch_id)}</span>
                    <span className="text-muted-foreground"> · Broker {asDisplayText(batch.broker)}</span>
                    <span
                      className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(asDisplayText(batch.status))}`}
                    >
                      {asDisplayText(batch.status).toUpperCase()}
                    </span>
                  </Link>
                </li>
              ))}
              {commissionBatches.length === 0 ? (
                <li className="text-muted-foreground">No commission batches found.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Withdrawals ({withdrawals.length})</h2>
            <ul className="space-y-2 text-sm">
              {withdrawals.map((withdrawal) => (
                <li key={withdrawal.id}>
                  <Link href={`/admin/finance/withdrawals?withdrawal_id=${withdrawal.id}`} className="text-primary hover:underline">
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs">WITHDRAWAL</span>
                    <span>{asDisplayText(withdrawal.id)}</span>
                    <span className="text-muted-foreground"> · User {asDisplayText(withdrawal.user_id)}</span>
                    <span
                      className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(asDisplayText(withdrawal.status))}`}
                    >
                      {asDisplayText(withdrawal.status).toUpperCase()}
                    </span>
                    <span className="text-muted-foreground"> · {Number(withdrawal.amount ?? 0).toLocaleString()}</span>
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
