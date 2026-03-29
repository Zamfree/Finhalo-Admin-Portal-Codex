import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import type { WithdrawalRow } from "../../_types";
import { WithdrawalWorkflowActions } from "../withdrawal-workflow-actions";
import {
  getWithdrawalChecklist,
  getWithdrawalCurrentActionHint,
} from "./withdrawal-audit";
import { WithdrawalWorkOrderSummary } from "./withdrawal-work-order-summary";

export function WithdrawalHandoffTab({
  withdrawal,
  showQuickLinks = true,
}: {
  withdrawal: WithdrawalRow;
  showQuickLinks?: boolean;
}) {
  const accountId = withdrawal.account_id && withdrawal.account_id !== "-" ? withdrawal.account_id : null;
  const checklist = getWithdrawalChecklist(withdrawal);
  const blockingItems = checklist.filter((item) => !item.passed);

  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Operations</h3>}
      description={
        <p className="text-sm text-zinc-400">
          Workflow transitions run server-side and are audit logged. Use this panel for operational checks and guarded state moves.
        </p>
      }
    >
      <div className="mb-4">
        <WithdrawalWorkOrderSummary withdrawal={withdrawal} />
      </div>
      <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Current Action Hint</p>
        <p className="mt-1 text-sm text-zinc-300">{getWithdrawalCurrentActionHint(withdrawal.status)}</p>
      </div>

      <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Operation Checklist
        </p>
        <div className="mt-2 space-y-1.5">
          {checklist.map((item) => (
            <p key={item.label} className={`text-xs ${item.passed ? "text-emerald-300" : "text-amber-300"}`}>
              {item.passed ? "PASS" : "CHECK"} | {item.label}
            </p>
          ))}
        </div>
        {blockingItems.length > 0 ? (
          <p className="mt-2 text-xs text-amber-300">
            Blocking checks: {blockingItems.map((item) => item.label).join(" / ")}
          </p>
        ) : (
          <p className="mt-2 text-xs text-emerald-300">All checklist items are satisfied for current state.</p>
        )}
      </div>

      {showQuickLinks ? (
        <div className="flex flex-wrap gap-3">
          <ReturnContextLink href={`/admin/users/${withdrawal.user_id}`}>
            <AdminButton variant="ghost">View User</AdminButton>
          </ReturnContextLink>

          {accountId ? (
            <ReturnContextLink href={`/admin/accounts/${accountId}`}>
              <AdminButton variant="ghost">View Account</AdminButton>
            </ReturnContextLink>
          ) : null}

          <ReturnContextLink
            href="/admin/finance/ledger"
            query={{ query: withdrawal.withdrawal_id }}
          >
            <AdminButton variant="ghost">View Ledger Links</AdminButton>
          </ReturnContextLink>

          {accountId ? (
            <ReturnContextLink href="/admin/network" query={{ detail_account_id: accountId, tab: "overview" }}>
              <AdminButton variant="secondary">View Network Context</AdminButton>
            </ReturnContextLink>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        <WithdrawalWorkflowActions withdrawalId={withdrawal.withdrawal_id} status={withdrawal.status} compact />
      </div>
    </DataPanel>
  );
}
