import Link from "next/link";

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

const MOCK_USERS: UserResult[] = [
  { user_id: "USR-1001", email: "alex@finhalo.test" },
  { user_id: "USR-1002", email: "mia@finhalo.test" },
  { user_id: "USR-1004", email: "olivia@finhalo.test" },
];

const MOCK_TRADING_ACCOUNTS: TradingAccountResult[] = [
  { account_id: "ACC-2001", account_number: "8800123", user_id: "USR-1001" },
  { account_id: "ACC-2002", account_number: "8800456", user_id: "USR-1002" },
  { account_id: "ACC-2003", account_number: "8800789", user_id: "USR-1003" },
];

const MOCK_BATCHES: CommissionBatchResult[] = [
  { batch_id: "BATCH-2401", broker: "BrokerOne", status: "approved" },
  { batch_id: "BATCH-2402", broker: "Prime Markets", status: "pending" },
  { batch_id: "BATCH-2403", broker: "Vertex Trade", status: "pending" },
];

const MOCK_WITHDRAWALS: WithdrawalResult[] = [
  { id: "WDL-3001", user_id: "USR-1001", amount: 120, status: "pending" },
  { id: "WDL-3002", user_id: "USR-1002", amount: 250, status: "approved" },
  { id: "WDL-3003", user_id: "USR-1003", amount: 80, status: "rejected" },
];

function includesTerm(values: string[], query: string) {
  return values.some((value) => value.toLowerCase().includes(query));
}

export default async function AdminSearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();

  const users = normalizedQuery
    ? MOCK_USERS.filter((row) => includesTerm([row.user_id, row.email], normalizedQuery))
    : [];

  const tradingAccounts = normalizedQuery
    ? MOCK_TRADING_ACCOUNTS.filter((row) =>
        includesTerm([row.account_id, row.account_number, row.user_id], normalizedQuery),
      )
    : [];

  const commissionBatches = normalizedQuery
    ? MOCK_BATCHES.filter((row) => includesTerm([row.batch_id, row.broker, row.status], normalizedQuery))
    : [];

  const withdrawals = normalizedQuery
    ? MOCK_WITHDRAWALS.filter((row) =>
        includesTerm([row.id, row.user_id, row.status, String(row.amount)], normalizedQuery),
      )
    : [];

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Global Search</h1>
        <p className="mb-4 text-sm text-muted-foreground">Search across static admin entities for deployment preview workflows.</p>
        <form className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            name="q"
            defaultValue=""
            placeholder="Search users, accounts, batches, withdrawals"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm md:max-w-xl"
          />
          <button type="button" className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            Search (Preview)
          </button>
        </form>
      </section>

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
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Trading Accounts</h2>
        <ul className="space-y-2 text-sm">
          {tradingAccounts.map((account) => (
            <li key={account.account_id}>
              <Link href={`/admin/accounts/${account.account_id}`} className="text-primary hover:underline">
                {account.account_number} (Account ID: {account.account_id})
              </Link>
            </li>
          ))}
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
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Withdrawals</h2>
        <ul className="space-y-2 text-sm">
          {withdrawals.map((withdrawal) => (
            <li key={withdrawal.id}>
              <Link href="/admin/finance/withdrawals" className="text-primary hover:underline">
                {withdrawal.id} — {withdrawal.user_id} ({withdrawal.status}, {withdrawal.amount.toLocaleString()})
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
