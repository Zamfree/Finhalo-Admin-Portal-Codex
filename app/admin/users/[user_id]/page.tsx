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

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
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

  const rawUser = userRes.data as UserRow;
  const user = {
    user_id: asNonEmptyString(rawUser.user_id, "-"),
    email: asNonEmptyString(rawUser.email),
    role: asNonEmptyString(rawUser.role),
    created_at: asNonEmptyString(rawUser.created_at, ""),
  };

  const profile = (profileRes.data as ProfileRow | null) ?? null;

  const tradingAccounts = ((tradingAccountsRes.data as TradingAccountRow[] | null) ?? []).map((account) => ({
    account_id: asNonEmptyString(account.account_id, "-"),
    account_number: asNonEmptyString(account.account_number),
    status: asNonEmptyString(account.status),
  }));

  const commissionHistory = ((commissionHistoryRes.data as CommissionHistoryRow[] | null) ?? []).map((record) => ({
    id: asNonEmptyString(record.id, "-"),
    amount: asNumber(record.amount),
    created_at: asNonEmptyString(record.created_at, ""),
  }));

  const rebateHistory = ((rebateHistoryRes.data as RebateHistoryRow[] | null) ?? []).map((record) => ({
    id: asNonEmptyString(record.id, "-"),
    amount: asNumber(record.amount),
    created_at: asNonEmptyString(record.created_at, ""),
  }));

  const activeAccounts = tradingAccounts.filter((account) => account.status.toLowerCase() === "active").length;

  const commissionTotal = commissionHistory.reduce((sum, row) => sum + row.amount, 0);
  const latestCommissionDate = commissionHistory[0]?.created_at ?? "";

  const rebateTotal = rebateHistory.reduce((sum, row) => sum + row.amount, 0);
  const latestRebateDate = rebateHistory[0]?.created_at ?? "";

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
            <dd>{formatDateTime(user.created_at)}</dd>
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

        <p className="mt-3 text-xs text-muted-foreground">
          Support context: {profile?.full_name ?? user.email} · {profile?.phone ?? "No phone"} · {profile?.country ?? "No country"}
        </p>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Trading Accounts</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {tradingAccounts.length} accounts · {activeAccounts} active
        </p>
        <ul className="space-y-2 text-sm">
          {tradingAccounts.map((account) => (
            <li key={account.account_id} className="rounded-md border p-2">
              {account.account_number} · {account.status}
            </li>
          ))}
          {tradingAccounts.length === 0 ? <li className="text-muted-foreground">No trading accounts.</li> : null}
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Commission History</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {commissionHistory.length} records · Total {formatCurrency(commissionTotal)} · Latest {formatDateTime(latestCommissionDate)}
        </p>
        <ul className="space-y-2 text-sm">
          {commissionHistory.map((record) => (
            <li key={record.id} className="rounded-md border p-2">
              {record.id} · {record.amount.toLocaleString()} · {formatDateTime(record.created_at)}
            </li>
          ))}
          {commissionHistory.length === 0 ? <li className="text-muted-foreground">No commission history.</li> : null}
        </ul>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Rebate History</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {rebateHistory.length} records · Total {formatCurrency(rebateTotal)} · Latest {formatDateTime(latestRebateDate)} · Net {formatCurrency(rebateTotal - commissionTotal)}
        </p>
        <ul className="space-y-2 text-sm">
          {rebateHistory.map((record) => (
            <li key={record.id} className="rounded-md border p-2">
              {record.id} · {record.amount.toLocaleString()} · {formatDateTime(record.created_at)}
            </li>
          ))}
          {rebateHistory.length === 0 ? <li className="text-muted-foreground">No rebate history.</li> : null}
        </ul>
      </section>
    </div>
  );
}
