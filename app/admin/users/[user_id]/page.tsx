import type { ReactNode } from "react";

type UserDetailPageProps = {
  params: Promise<{
    user_id: string;
  }>;
};

type UserRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
};

type TradingAccountRow = {
  account_id: string;
  account_number: string;
  status: string;
};

type CommissionHistoryRow = {
  id: string;
  amount: number;
  created_at: string;
};

type RebateHistoryRow = {
  id: string;
  amount: number;
  created_at: string;
};

const MOCK_USERS: UserRow[] = [
  { user_id: "USR-1001", email: "alex@finhalo.test", role: "trader", created_at: "2026-02-01T10:30:00Z" },
  { user_id: "USR-1002", email: "mia@finhalo.test", role: "ib", created_at: "2026-02-03T08:14:00Z" },
  { user_id: "USR-1004", email: "olivia@finhalo.test", role: "admin", created_at: "2026-02-10T16:22:00Z" },
];

const MOCK_PROFILES: ProfileRow[] = [
  { user_id: "USR-1001", full_name: "Alex Carter", phone: "+1-202-555-0101", country: "United States" },
  { user_id: "USR-1002", full_name: "Mia Chen", phone: "+1-202-555-0102", country: "Singapore" },
  { user_id: "USR-1004", full_name: "Olivia Park", phone: "+1-202-555-0104", country: "United Kingdom" },
];

const MOCK_TRADING_ACCOUNTS: TradingAccountRow[] = [
  { account_id: "ACC-2001", account_number: "8800123", status: "active" },
  { account_id: "ACC-2002", account_number: "8800456", status: "active" },
  { account_id: "ACC-2003", account_number: "8800789", status: "inactive" },
];

const MOCK_COMMISSION_HISTORY: CommissionHistoryRow[] = [
  { id: "COM-5001", amount: 145.2, created_at: "2026-03-15T11:12:00Z" },
  { id: "COM-5002", amount: 116.8, created_at: "2026-03-14T09:08:00Z" },
  { id: "COM-5003", amount: 98.65, created_at: "2026-03-13T17:40:00Z" },
];

const MOCK_REBATE_HISTORY: RebateHistoryRow[] = [
  { id: "REB-7001", amount: 41.3, created_at: "2026-03-15T12:04:00Z" },
  { id: "REB-7002", amount: 32.9, created_at: "2026-03-14T10:10:00Z" },
  { id: "REB-7003", amount: 29.75, created_at: "2026-03-12T15:05:00Z" },
];

function renderListOrEmpty(items: ReactNode[], emptyText: string) {
  if (items.length === 0) {
    return <li className="text-muted-foreground">{emptyText}</li>;
  }

  return items;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { user_id } = await params;

  const user = MOCK_USERS.find((row) => row.user_id === user_id) ?? {
    user_id,
    email: `${user_id.toLowerCase()}@finhalo.test`,
    role: "trader",
    created_at: "2026-03-01T09:00:00Z",
  };

  const profile = MOCK_PROFILES.find((row) => row.user_id === user_id) ?? null;

  const tradingAccounts = MOCK_TRADING_ACCOUNTS;
  const commissionHistory = MOCK_COMMISSION_HISTORY;
  const rebateHistory = MOCK_REBATE_HISTORY;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-semibold">User Detail</h1>
        <p className="text-sm text-muted-foreground">Mock profile and activity context for preview-only investigation workflows.</p>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Profile</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd>{user.user_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created At</dt>
            <dd>{new Date(user.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Full Name</dt>
            <dd>{profile?.full_name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{profile?.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Country</dt>
            <dd>{profile?.country ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Trading Accounts</h2>
        <ul className="space-y-2 text-sm">
          {renderListOrEmpty(
            tradingAccounts.map((account) => (
              <li key={account.account_id} className="rounded-md border p-2">
                {account.account_number} · {account.status}
              </li>
            )),
            "No trading accounts.",
          )}
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Commission History</h2>
        <ul className="space-y-2 text-sm">
          {renderListOrEmpty(
            commissionHistory.map((record) => (
              <li key={record.id} className="rounded-md border p-2">
                {record.id} · {record.amount.toLocaleString()} · {new Date(record.created_at).toLocaleString()}
              </li>
            )),
            "No commission history.",
          )}
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Rebate History</h2>
        <ul className="space-y-2 text-sm">
          {renderListOrEmpty(
            rebateHistory.map((record) => (
              <li key={record.id} className="rounded-md border p-2">
                {record.id} · {record.amount.toLocaleString()} · {new Date(record.created_at).toLocaleString()}
              </li>
            )),
            "No rebate history.",
          )}
        </ul>
      </section>
    </div>
  );
}
