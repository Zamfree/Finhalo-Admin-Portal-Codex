import Link from "next/link";
import { notFound } from "next/navigation";
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

type IBRelationshipRow = {
  trader_id: string;
  l1_ib_id: string | null;
  l2_ib_id: string | null;
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
    ibRelationshipRes
  ] = await Promise.all([
    supabase
      .from("users")
      .select("user_id,email,role,created_at")
      .eq("user_id", user_id)
      .single(),
    supabase
      .from("profiles")
      .select("user_id,full_name,phone,country")
      .eq("user_id", user_id)
      .maybeSingle(),
    supabase
      .from("trading_accounts")
      .select("account_id,account_number,status")
      .eq("user_id", user_id)
      .limit(20),
    supabase
      .from("commission_records")
      .select("id,amount,created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("rebate_records")
      .select("id,amount,created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("ib_relationships")
      .select("trader_id,l1_ib_id,l2_ib_id")
      .or(`trader_id.eq.${user_id},l1_ib_id.eq.${user_id},l2_ib_id.eq.${user_id}`)
      .maybeSingle()
  ]);

  if (userRes.error) {
    if (userRes.error.code === "PGRST116") {
      notFound();
    }
    throw new Error(userRes.error.message);
  }

  const user = userRes.data as UserRow;
  const profile = (profileRes.data as ProfileRow | null) ?? null;
  const tradingAccounts = (tradingAccountsRes.data as TradingAccountRow[] | null) ?? [];
  const commissionHistory = (commissionHistoryRes.data as CommissionHistoryRow[] | null) ?? [];
  const rebateHistory = (rebateHistoryRes.data as RebateHistoryRow[] | null) ?? [];
  const ibRelationship = (ibRelationshipRes.data as IBRelationshipRow | null) ?? null;

  // Determine IB Role
  let ibRoleHint = "Trader";
  if (ibRelationship) {
    if (ibRelationship.l2_ib_id === user_id) ibRoleHint = "Parent IB (L2)";
    else if (ibRelationship.l1_ib_id === user_id) ibRoleHint = "Sub IB (L1)";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">User Details</h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/finance?user_id=${user_id}`}
            className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            View Ledger
          </Link>
          <Link
            href={`/admin/finance/withdrawals?user_id=${user_id}`}
            className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            View Withdrawals
          </Link>
        </div>
      </div>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Profile</h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
            {ibRoleHint}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</dt>
            <dd className="font-mono text-xs">{user.user_id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</dt>
            <dd className="capitalize">{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created At</dt>
            <dd>{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</dt>
            <dd className="font-medium">{profile?.full_name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</dt>
            <dd>{profile?.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Country</dt>
            <dd>{profile?.country ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Trading Accounts</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tradingAccounts.map((account) => (
            <div key={account.account_id} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
              <span className="font-mono font-medium">{account.account_number}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                account.status === 'active' ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {account.status}
              </span>
            </div>
          ))}
          {tradingAccounts.length === 0 ? (
            <div className="col-span-full py-4 text-center text-sm text-muted-foreground italic">
              No trading accounts found.
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-background p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Commission (Upstream)</h2>
            <Link
              href="/admin/commissions"
              className="text-[10px] text-muted-foreground hover:text-primary hover:underline"
            >
              Investigate All
            </Link>
          </div>
          <ul className="space-y-2">
            {commissionHistory.map((record) => (
              <li key={record.id} className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-muted-foreground">{record.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.created_at ? new Date(record.created_at).toLocaleDateString() : "-"}
                  </span>
                </div>
                <span className="font-mono font-medium text-green-600">
                  +{Number(record.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </li>
            ))}
            {commissionHistory.length === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground italic">
                No upstream commission records.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-lg border bg-background p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Rebate / Finance (Downstream)</h2>
            <Link
              href={`/admin/finance?user_id=${user_id}&transaction_type=rebate`}
              className="text-[10px] text-muted-foreground hover:text-primary hover:underline"
            >
              Filter Ledger
            </Link>
          </div>
          <ul className="space-y-2">
            {rebateHistory.map((record) => (
              <li key={record.id} className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-muted-foreground">{record.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.created_at ? new Date(record.created_at).toLocaleDateString() : "-"}
                  </span>
                </div>
                <span className="font-mono font-medium text-primary">
                  {Number(record.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </li>
            ))}
            {rebateHistory.length === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground italic">
                No downstream rebate/ledger records.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
