import { notFound } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

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

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { user_id } = await params;
  const supabase = await createClient();

  const [
    userRes,
    profileRes,
    tradingAccountsRes,
    commissionHistoryRes,
    rebateHistoryRes,
    withdrawalsCountRes,
    ticketsCountRes,
  ] = await Promise.all([
    supabase.from("users").select("user_id,email,role,created_at").eq("user_id", user_id).single(),
    supabase.from("profiles").select("user_id,full_name,phone,country").eq("user_id", user_id).maybeSingle(),
    supabase.from("trading_accounts").select("account_id,account_number,status").eq("user_id", user_id).limit(20),
    supabase.from("commission_records").select("id,amount,created_at").eq("user_id", user_id).order("created_at", { ascending: false }).limit(20),
    supabase.from("rebate_records").select("id,amount,created_at").eq("user_id", user_id).order("created_at", { ascending: false }).limit(20),
    supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("user_id", user_id),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", user_id),
  ]);

  if (userRes.error) {
    if (userRes.error.code === "PGRST116") {
      notFound();
    }
    throw new Error(userRes.error.message);
  }

  if (profileRes.error) throw new Error(profileRes.error.message);
  if (tradingAccountsRes.error) throw new Error(tradingAccountsRes.error.message);
  if (commissionHistoryRes.error) throw new Error(commissionHistoryRes.error.message);
  if (rebateHistoryRes.error) throw new Error(rebateHistoryRes.error.message);

  const user = userRes.data as UserRow;
  const profile = (profileRes.data as ProfileRow | null) ?? null;
  const tradingAccounts = (tradingAccountsRes.data as TradingAccountRow[] | null) ?? [];
  const commissionHistory = (commissionHistoryRes.data as CommissionHistoryRow[] | null) ?? [];
  const rebateHistory = (rebateHistoryRes.data as RebateHistoryRow[] | null) ?? [];

  const withdrawalsCount = withdrawalsCountRes.count ?? 0;
  const ticketsCount = ticketsCountRes.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Quick Navigation Section */}
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Related Records & Navigation</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/finance?user_id=${user_id}`}
            className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted transition-colors"
          >
            View Finance Ledger
          </Link>

          <Link
            href={`/admin/search?q=${user_id}`}
            className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted transition-colors"
          >
            Investigate All Records ({withdrawalsCount} withdrawals, {ticketsCount} tickets)
          </Link>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Profile</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd className="font-mono">{user.user_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {user.role}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created At</dt>
            <dd>{new Date(user.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Full Name</dt>
            <dd className="font-medium">{profile?.full_name ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{profile?.phone ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Country</dt>
            <dd>{profile?.country ?? "Not provided"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Trading Accounts</h2>
        <ul className="space-y-2 text-sm">
          {tradingAccounts.map((account) => (
            <li key={account.account_id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <span className="font-mono font-medium">{account.account_number}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {account.status}
                </span>
              </div>
              <Link
                href={`/admin/search?q=${account.account_number}`}
                className="text-xs text-primary hover:underline"
              >
                Search Account
              </Link>
            </li>
          ))}
          {tradingAccounts.length === 0 ? (
            <li className="py-2 text-muted-foreground italic">No trading accounts linked to this user.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Commission History</h2>
        <ul className="space-y-2 text-sm">
          {commissionHistory.map((record) => (
            <li key={record.id} className="rounded-md border p-2 flex justify-between items-center">
              <span className="font-mono text-[11px] text-muted-foreground">{record.id}</span>
              <div className="text-right">
                <span className="font-medium text-green-600">${record.amount.toLocaleString()}</span>
                <div className="text-[10px] text-muted-foreground">{new Date(record.created_at).toLocaleString()}</div>
              </div>
            </li>
          ))}
          {commissionHistory.length === 0 ? <li className="text-muted-foreground italic">No commission history.</li> : null}
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Rebate History</h2>
        <ul className="space-y-2 text-sm">
          {rebateHistory.map((record) => (
            <li key={record.id} className="rounded-md border p-2 flex justify-between items-center">
              <span className="font-mono text-[11px] text-muted-foreground">{record.id}</span>
              <div className="text-right">
                <span className="font-medium text-blue-600">${record.amount.toLocaleString()}</span>
                <div className="text-[10px] text-muted-foreground">{new Date(record.created_at).toLocaleString()}</div>
              </div>
            </li>
          ))}
          {rebateHistory.length === 0 ? <li className="text-muted-foreground italic">No rebate history.</li> : null}
        </ul>
      </section>
    </div>
  );
}
