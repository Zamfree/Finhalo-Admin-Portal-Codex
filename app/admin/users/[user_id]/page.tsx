import { notFound } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { UnavailableHint } from "@/components/system/feedback/unavailable-hint";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import {
  getAdminAccountsForUser,
  getAdminUserActivitySummary,
  getAdminUserById,
} from "@/services/admin/users.service";

import { SummaryCard } from "../_shared";
import type { UserStatus } from "../_types";

type UserDetailPageProps = {
  params: Promise<{
    user_id: string;
  }>;
};

function getStatusClass(status: UserStatus) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "restricted") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { user_id } = await params;
  const user = await getAdminUserById(user_id);

  if (!user) {
    notFound();
  }

  const accounts = await getAdminAccountsForUser(user.user_id);
  const primaryAccount = accounts[0] ?? null;
  const activitySummary = await getAdminUserActivitySummary(user.user_id);

  return (
    <div className="space-y-6 pb-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Admin / Users
          </p>
          <ReturnToContextButton
            fallbackPath="/admin/users"
            label="Back to Users"
            variant="ghost"
            className="px-3 py-2"
          />
        </div>
        <h1 className="break-words text-4xl font-bold tracking-tight text-white md:text-5xl">
          {user.display_name}
          <span className="ml-1.5 inline-block text-blue-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Identity and owner view for a platform user, with downstream navigation into the trading
          accounts that act as the operational anchor entities.
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-3">
            {primaryAccount ? (
              <>
                <ReturnContextLink href={`/admin/accounts/${primaryAccount.account_id}`}>
                  <AdminButton variant="secondary" className="h-10 px-4">
                    View Account
                  </AdminButton>
                </ReturnContextLink>
                <ReturnContextLink
                  href="/admin/commission"
                  query={{ query: primaryAccount.account_id }}
                >
                  <AdminButton variant="ghost" className="h-10 px-4">
                    View Commission
                  </AdminButton>
                </ReturnContextLink>
                <ReturnContextLink
                  href="/admin/finance/ledger"
                  query={{ account_id: primaryAccount.account_id }}
                >
                  <AdminButton variant="primary" className="h-10 px-4">
                    View Finance
                  </AdminButton>
                </ReturnContextLink>
              </>
            ) : (
              <>
                <AdminButton
                  variant="secondary"
                  className="h-10 px-4"
                  disabled
                  title="No trading account is linked to this user yet."
                >
                  View Account
                </AdminButton>
                <ReturnContextLink href="/admin/commission" query={{ query: user.user_id }}>
                  <AdminButton
                    variant="ghost"
                    className="h-10 px-4"
                    title="Open commission module with user context."
                  >
                    View Commission
                  </AdminButton>
                </ReturnContextLink>
                <ReturnContextLink href="/admin/finance/ledger" query={{ user_id: user.user_id }}>
                  <AdminButton
                    variant="primary"
                    className="h-10 px-4"
                    title="Open finance ledger with user context."
                  >
                    View Finance
                  </AdminButton>
                </ReturnContextLink>
              </>
            )}
          </div>
          {!primaryAccount ? (
            <UnavailableHint>
              Trading-account handoff is unavailable until this user has at least one linked
              account. Commission and Finance links remain available with user-level context.
            </UnavailableHint>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataPanel title={<h2 className="text-xl font-semibold text-white">User Overview</h2>}>
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Name
              </dt>
              <dd className="mt-2 break-words text-zinc-200">{user.display_name}</dd>
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
              <dd className="mt-2 break-all text-zinc-200">{user.email}</dd>
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
              <p className="mt-2 break-words text-sm text-zinc-300">{activitySummary.commission_summary}</p>
            </div>
            <div className="admin-surface-soft rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Finance</p>
              <p className="mt-2 break-words text-sm text-zinc-300">{activitySummary.finance_summary}</p>
            </div>
            <div className="admin-surface-soft rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Rebate</p>
              <p className="mt-2 break-words text-sm text-zinc-300">{activitySummary.rebate_summary}</p>
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
              <div key={account.account_id} className="admin-surface-soft min-w-0 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="break-all font-mono text-sm text-white">{account.account_id}</p>
                    <p className="truncate text-sm text-zinc-300">{account.broker}</p>
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
                  <ReturnContextLink href={`/admin/accounts/${account.account_id}`}>
                    <AdminButton variant="ghost" className="px-3 py-2">
                      View Account
                    </AdminButton>
                  </ReturnContextLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Owned Accounts" value={accounts.length} emphasis="strong" />
        <SummaryCard label="Active Accounts" value={accounts.filter((account) => account.status === "active").length} />
        <SummaryCard label="Brokers Used" value={new Set(accounts.map((account) => account.broker)).size} />
      </div>
    </div>
  );
}
