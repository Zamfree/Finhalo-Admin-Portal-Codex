import Link from "next/link";
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

function canUseRouteParam(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function buildFinanceUserHref(userId: string | null | undefined): string | null {
  if (!canUseRouteParam(userId)) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("user_id", userId.trim());
  return `/admin/finance?${params.toString()}`;
}

function buildSearchHref(query: string | null | undefined): string | null {
  if (!canUseRouteParam(query)) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("q", query.trim());
  return `/admin/search?${params.toString()}`;
}

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
        .select("account_id,account_number,status")
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

  const financeUserHref = buildFinanceUserHref(user.user_id);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Profile</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd>
              <div>{user.user_id}</div>
              {financeUserHref ? (
                <Link href={financeUserHref} className="text-xs text-primary hover:underline">
                  View finance ledger entries
                </Link>
              ) : null}
            </dd>
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
          {tradingAccounts.map((account) => {
            const accountSearchHref = buildSearchHref(account.account_number);

            return (
              <li key={account.account_id} className="rounded-md border p-2">
                {accountSearchHref ? (
                  <Link href={accountSearchHref} className="text-primary hover:underline">
                    {account.account_number}
                  </Link>
                ) : (
                  account.account_number
                )}
                {" · "}
                {account.status}
              </li>
            );
          })}
          {tradingAccounts.length === 0 ? <li className="text-muted-foreground">No trading accounts.</li> : null}
        </ul>
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
