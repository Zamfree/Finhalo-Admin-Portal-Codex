"use client";

import { useActionState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";
import {
  bindTradingAccountAction,
  updateTradingAccountStatusAction,
  type UserMutationState,
} from "../actions";

const INITIAL_STATE: UserMutationState = {};

export function UserAccountsTab({
  accounts,
  userId,
}: {
  accounts: TradingAccountRecord[];
  userId: string | null;
}) {
  const [bindState, bindFormAction, isBindPending] = useActionState(
    bindTradingAccountAction,
    INITIAL_STATE
  );
  const [accountState, accountFormAction, isAccountPending] = useActionState(
    updateTradingAccountStatusAction,
    INITIAL_STATE
  );

  return (
    <DataPanel
      title={
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Owned Trading Accounts
        </h3>
      }
      description="Trading accounts are the operational anchor entities for commission, rebate, and finance flow."
    >
      <form action={bindFormAction} className="mb-4 space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <input type="hidden" name="user_id" value={userId ?? ""} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Bind MT Trading Account
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="account_id"
            required
            placeholder="MT account id"
            className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
          <AdminButton
            type="submit"
            variant="secondary"
            className="h-10 px-4"
            disabled={!userId || isBindPending}
          >
            {isBindPending ? "Binding..." : "Bind Account"}
          </AdminButton>
        </div>
        {bindState.error ? (
          <p className="break-words text-xs text-rose-300">{bindState.error}</p>
        ) : null}
        {bindState.success ? (
          <p className="break-words text-xs text-emerald-300">{bindState.success}</p>
        ) : null}
      </form>

      {accounts.length === 0 ? (
        <div className="admin-surface-soft rounded-xl p-6 text-sm text-zinc-500" role="status" aria-live="polite">
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
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                    {account.account_type}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  {account.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <ReturnContextLink href={`/admin/accounts/${account.account_id}`}>
                  <AdminButton variant="ghost" className="px-3 py-2">
                    View Account
                  </AdminButton>
                </ReturnContextLink>
                <ReturnContextLink href="/admin/commission" query={{ account_id: account.account_id }}>
                  <AdminButton variant="secondary" className="px-3 py-2">
                    View Commission
                  </AdminButton>
                </ReturnContextLink>
                <form action={accountFormAction}>
                  <input type="hidden" name="account_id" value={account.account_id} />
                  <input
                    type="hidden"
                    name="status"
                    value={account.status === "suspended" ? "active" : "suspended"}
                  />
                  <AdminButton
                    type="submit"
                    variant={account.status === "suspended" ? "secondary" : "ghost"}
                    className="px-3 py-2"
                    disabled={isAccountPending}
                  >
                    {account.status === "suspended" ? "Enable Account" : "Disable Account"}
                  </AdminButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
      {accountState.error ? (
        <p className="mt-3 break-words text-xs text-rose-300">{accountState.error}</p>
      ) : null}
      {accountState.success ? (
        <p className="mt-3 break-words text-xs text-emerald-300">{accountState.success}</p>
      ) : null}
    </DataPanel>
  );
}
