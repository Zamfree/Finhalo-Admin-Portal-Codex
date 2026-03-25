import Link from "next/link";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";
import type { UserRow } from "@/types/user";

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
        <Link href={`/admin/users/${user.user_id}`}>
          <AdminButton variant="ghost">Open {user.display_name}</AdminButton>
        </Link>
        {primaryAccount ? (
          <>
            <Link href={`/admin/accounts/${primaryAccount.account_id}`}>
              <AdminButton variant="secondary">View Account</AdminButton>
            </Link>
            <Link
              href={`/admin/finance/ledger?account_id=${encodeURIComponent(primaryAccount.account_id)}`}
            >
              <AdminButton variant="primary">View Finance</AdminButton>
            </Link>
          </>
        ) : null}
      </div>
    </DataPanel>
  );
}
