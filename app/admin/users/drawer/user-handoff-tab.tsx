import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";
import type { UserRow } from "../_types";

export function UserHandoffTab({
  user,
  primaryAccount,
}: {
  user: UserRow;
  primaryAccount: TradingAccountRecord | null;
}) {
  return (
    <DataPanel
      title={
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Handoff
        </h3>
      }
      description="Keep handoff lightweight: owner context first, then the downstream account hub."
    >
      <div className="flex flex-wrap gap-3">
        <ReturnContextLink href={`/admin/users/${user.user_id}`}>
          <AdminButton variant="ghost">Open {user.display_name}</AdminButton>
        </ReturnContextLink>
        {primaryAccount ? (
          <>
            <ReturnContextLink href={`/admin/accounts/${primaryAccount.account_id}`}>
              <AdminButton variant="secondary">View Account</AdminButton>
            </ReturnContextLink>
            <ReturnContextLink
              href="/admin/finance/ledger"
              query={{ account_id: primaryAccount.account_id }}
            >
              <AdminButton variant="primary">View Finance</AdminButton>
            </ReturnContextLink>
          </>
        ) : null}
      </div>
    </DataPanel>
  );
}
