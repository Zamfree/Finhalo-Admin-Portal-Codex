import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";

export function UserAccountsTab({ accounts }: { accounts: TradingAccountRecord[] }) {
  return (
    <DataPanel
      title={
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Owned Trading Accounts
        </h3>
      }
      description="Trading accounts are the operational anchor entities for commission, rebate, and finance flow."
    >
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
              </div>
            </div>
          ))}
        </div>
      )}
    </DataPanel>
  );
}
