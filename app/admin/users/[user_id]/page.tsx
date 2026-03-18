import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";

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
  account_number: string;
  account_status: string;
  created_at: string;
  broker_id: string | null;
  brokers: {
    name: string | null;
  } | null;
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

  const [userRes, profileRes, tradingAccountsRes, commissionHistoryRes, rebateHistoryRes] =
    await Promise.all([
      supabaseServer
        .from("users")
        .select("user_id,email,role,created_at")
        .eq("user_id", user_id)
        .single(),
      supabaseServer
        .from("profiles")
        .select("user_id,full_name,phone,country")
        .eq("user_id", user_id)
        .maybeSingle(),
      supabaseServer
        .from("trading_accounts")
        .select("account_number,account_status,created_at,broker_id,brokers(name)")
        .eq("user_id", user_id)
        .limit(20),
      supabaseServer
        .from("commission_records")
        .select("id,amount,created_at")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseServer
        .from("rebate_records")
        .select("id,amount,created_at")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(20),
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

  return (
    <div className="space-y-6">
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Account Number</th>
                <th className="py-2 pr-4 font-medium">Broker</th>
                <th className="py-2 pr-4 font-medium">Account Status</th>
                <th className="py-2 pr-4 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody>
              {tradingAccounts.map((account) => (
                <tr key={`${account.account_number}-${account.created_at}`} className="border-b last:border-0">
                  <td className="py-2 pr-4">{account.account_number}</td>
                  <td className="py-2 pr-4">{account.brokers?.name ?? account.broker_id ?? "-"}</td>
                  <td className="py-2 pr-4">{account.account_status}</td>
                  <td className="py-2 pr-4">{new Date(account.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {tradingAccounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground">
                    No trading accounts.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Commission History</h2>
        <ul className="space-y-2 text-sm">
          {commissionHistory.map((record) => (
            <li key={record.id} className="rounded-md border p-2">
              {record.id} · {record.amount.toLocaleString()} · {new Date(record.created_at).toLocaleString()}
            </li>
          ))}
          {commissionHistory.length === 0 ? <li className="text-muted-foreground">No commission history.</li> : null}
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Rebate History</h2>
        <ul className="space-y-2 text-sm">
          {rebateHistory.map((record) => (
            <li key={record.id} className="rounded-md border p-2">
              {record.id} · {record.amount.toLocaleString()} · {new Date(record.created_at).toLocaleString()}
            </li>
          ))}
          {rebateHistory.length === 0 ? <li className="text-muted-foreground">No rebate history.</li> : null}
        </ul>
      </section>
    </div>
  );
}
