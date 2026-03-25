import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";

import { getAccountsForUser, MOCK_USER_ACTIVITY_SUMMARY, MOCK_USERS } from "../_mock-data";
import { SummaryCard } from "../_shared";

type UserDetailPageProps = {
  params: Promise<{
    user_id: string;
  }>;
};

function getStatusClass(status: (typeof MOCK_USERS)[number]["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "restricted") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { user_id } = await params;
  const user = MOCK_USERS.find((row) => row.user_id === user_id);

  if (!user) {
    notFound();
  }

  const accounts = getAccountsForUser(user.user_id);
  const primaryAccount = accounts[0] ?? null;
  const activitySummary = MOCK_USER_ACTIVITY_SUMMARY[user.user_id] ?? {
    commission_summary: "No downstream commission activity yet",
    finance_summary: "No downstream finance activity yet",
    rebate_summary: "No downstream rebate activity yet",
  };

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Users
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {user.display_name}
          <span className="ml-1.5 inline-block text-blue-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Identity and owner view for a platform user, with downstream handoff into the trading
          accounts that act as the operational anchor entities.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataPanel title={<h2 className="text-xl font-semibold text-white">User Overview</h2>}>
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Name
              </dt>
              <dd className="mt-2 text-zinc-200">{user.display_name}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                User ID
              </dt>
              <dd className="mt-2 font-mono text-zinc-200">{user.user_id}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Email
              </dt>
              <dd className="mt-2 text-zinc-200">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Status
              </dt>
              <dd className="mt-2">
                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(user.status)}`}>
                  {user.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Created At
              </dt>
              <dd className="mt-2 text-zinc-200">{new Date(user.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </DataPanel>

        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">Related Activity Summary</h2>}
          description={
            <p className="max-w-2xl text-sm text-zinc-400">
              These summaries roll up downstream activity from owned trading accounts rather than
              treating the user as the business relationship anchor.
            </p>
          }
        >
          <div className="space-y-4">
            <div className="admin-surface-soft rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Commission</p>
              <p className="mt-2 text-sm text-zinc-300">{activitySummary.commission_summary}</p>
            </div>
            <div className="admin-surface-soft rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Finance</p>
              <p className="mt-2 text-sm text-zinc-300">{activitySummary.finance_summary}</p>
            </div>
            <div className="admin-surface-soft rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Rebate</p>
              <p className="mt-2 text-sm text-zinc-300">{activitySummary.rebate_summary}</p>
            </div>
          </div>
        </DataPanel>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Owned Trading Accounts</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            Trading accounts are the downstream operational entities. Use them to inspect broker
            context, account-level relationship snapshots, and connected commission or finance activity.
          </p>
        }
      >
        {accounts.length === 0 ? (
          <div className="admin-surface-soft rounded-xl p-6 text-sm text-zinc-500">
            No trading accounts are currently linked to this user.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <div key={account.account_id} className="admin-surface-soft rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-mono text-sm text-white">{account.account_id}</p>
                    <p className="text-sm text-zinc-300">{account.broker}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{account.account_type}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                    account.status === "active"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : account.status === "monitoring"
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-rose-500/10 text-rose-300"
                  }`}>
                    {account.status}
                  </span>
                </div>
                <div className="mt-4">
                  <Link href={`/admin/accounts/${account.account_id}`}>
                    <AdminButton variant="ghost" className="px-3 py-2">
                      View Account
                    </AdminButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Navigation / Handoff</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            The main downstream handoff is into Trading Accounts, with Commission and Finance kept
            as secondary modules once account context is understood.
          </p>
        }
      >
        <div className="flex flex-wrap gap-3">
          {primaryAccount ? (
            <>
              <Link href={`/admin/accounts/${primaryAccount.account_id}`}>
                <AdminButton variant="secondary" className="h-11 px-5">
                  View Account
                </AdminButton>
              </Link>
              <Link href={`/admin/commission?account_id=${encodeURIComponent(primaryAccount.account_id)}`}>
                <AdminButton variant="ghost" className="h-11 px-5">
                  View Commission
                </AdminButton>
              </Link>
              <Link href={`/admin/finance/ledger?account_id=${encodeURIComponent(primaryAccount.account_id)}`}>
                <AdminButton variant="primary" className="h-11 px-5">
                  View Finance
                </AdminButton>
              </Link>
            </>
          ) : (
            <>
              <AdminButton variant="secondary" className="h-11 px-5" disabled>
                View Account
              </AdminButton>
              <AdminButton variant="ghost" className="h-11 px-5" disabled>
                View Commission
              </AdminButton>
              <AdminButton variant="primary" className="h-11 px-5" disabled>
                View Finance
              </AdminButton>
            </>
          )}
        </div>
      </DataPanel>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Owned Accounts" value={accounts.length} emphasis="strong" />
        <SummaryCard label="Active Accounts" value={accounts.filter((account) => account.status === "active").length} />
        <SummaryCard label="Brokers Used" value={new Set(accounts.map((account) => account.broker)).size} />
      </div>
    </div>
  );
}
