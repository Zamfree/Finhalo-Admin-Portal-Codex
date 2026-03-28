import { DataPanel } from "@/components/system/data/data-panel";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";

export function UserRelationshipTab({ accounts }: { accounts: TradingAccountRecord[] }) {
  const relationshipRows = accounts.map((account) => ({
    accountId: account.account_id,
    trader: account.trader_display_name || account.trader_user_id,
    l1: account.l1_ib_display_name || account.l1_ib_id || "None",
    l2: account.l2_ib_display_name || account.l2_ib_id || "None",
    snapshot: account.snapshot_code,
  }));

  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Relationship</h3>}
      description="Account-level relationship context (Trader / L1 / L2) tied to owned accounts."
    >
      {relationshipRows.length === 0 ? (
        <div className="admin-surface-soft rounded-xl p-6 text-sm text-zinc-500">
          No account-level relationship data is available until at least one trading account is linked.
        </div>
      ) : (
        <div className="grid gap-3">
          {relationshipRows.map((row) => (
            <div key={row.accountId} className="admin-surface-soft grid gap-3 rounded-xl p-4 md:grid-cols-5">
              <Detail label="Account" value={row.accountId} mono />
              <Detail label="Trader" value={row.trader} />
              <Detail label="L1" value={row.l1} />
              <Detail label="L2" value={row.l2} />
              <Detail label="Snapshot" value={row.snapshot} mono />
            </div>
          ))}
        </div>
      )}
    </DataPanel>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={mono ? "break-all font-mono text-sm text-zinc-300" : "break-words text-sm text-zinc-300"}>
        {value}
      </p>
    </div>
  );
}

