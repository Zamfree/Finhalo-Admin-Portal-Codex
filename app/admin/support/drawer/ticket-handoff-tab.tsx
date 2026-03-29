import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { UnavailableHint } from "@/components/system/feedback/unavailable-hint";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { getSupportActionPosture } from "../_mappers";
import { SupportHandoffQueueForm } from "../support-handoff-queue-form";
import { SupportNoteComposer } from "../support-note-composer";
import { SupportReplyComposer } from "../support-reply-composer";
import type { SupportTicket } from "../_types";

export function TicketHandoffTab({
  ticket,
  t,
  showQuickLinks = true,
}: {
  ticket: SupportTicket;
  t: (key: string) => string;
  showQuickLinks?: boolean;
}) {
  const actionPosture = getSupportActionPosture(ticket);
  const commissionQuery = ticket.account_id
    ? { query: ticket.account_id }
    : { query: ticket.user_id };
  const financeQuery = ticket.ledger_ref
    ? { ledger_ref: ticket.ledger_ref }
    : ticket.rebate_record_id
      ? { rebate_record_id: ticket.rebate_record_id }
      : ticket.account_id
        ? { account_id: ticket.account_id }
        : { user_id: ticket.user_id };

  return (
    <div className={showQuickLinks ? "grid gap-6 lg:grid-cols-[1.05fr_0.95fr]" : "space-y-6"}>
      {showQuickLinks ? (
        <DataPanel
          title={
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("common.labels.handoff")}
            </h3>
          }
          description={
            <p className="text-sm text-zinc-400">
              Move from the ticket into the linked owner, trading account, commission review, or
              finance record only when record context exists.
            </p>
          }
        >
          <div className="flex flex-wrap gap-3">
            <ReturnContextLink href={`/admin/users/${ticket.user_id}`}>
              <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
            </ReturnContextLink>
            {ticket.account_id ? (
              <ReturnContextLink href={`/admin/accounts/${ticket.account_id}`}>
                <AdminButton variant="secondary">{t("common.actions.viewAccount")}</AdminButton>
              </ReturnContextLink>
            ) : (
              <AdminButton
                variant="secondary"
                disabled
                title="No linked account is available for this case."
              >
                {t("common.actions.viewAccount")}
              </AdminButton>
            )}
            <ReturnContextLink href="/admin/commission" query={commissionQuery}>
              <AdminButton variant="ghost">{t("common.actions.viewCommission")}</AdminButton>
            </ReturnContextLink>
            <ReturnContextLink href="/admin/finance/ledger" query={financeQuery}>
              <AdminButton variant="primary">{t("common.actions.viewFinance")}</AdminButton>
            </ReturnContextLink>
          </div>
          {!ticket.account_id ? (
            <div className="mt-3">
              <UnavailableHint>
              Account handoff stays disabled until the ticket is linked to an account. Commission and Finance remain available with ticket user context.
              </UnavailableHint>
            </div>
          ) : null}
        </DataPanel>
      ) : null}

      <DataPanel
        title={
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Reply & Action
          </h3>
        }
        description={
          <p className="text-sm text-zinc-400">
            Use the existing reply action where appropriate, while still leaving internal notes and
            ownership as future guarded extensions.
          </p>
        }
      >
        <div className="space-y-3 text-sm text-zinc-300">
          <div className="admin-surface-soft rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Recommended Flow
            </p>
            <p className="mt-2 break-words">Review case context, inspect linked records, then hand off into the relevant operational module.</p>
          </div>
          <div className="admin-surface-soft rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Reply Workflow
            </p>
            <p className="mt-2 break-words text-zinc-300">
              Current action mode: {actionPosture.actionStatusLabel}. Next reply state: {actionPosture.nextReplyStatusLabel}.
            </p>
            <p className="mt-2 break-words text-zinc-400">{actionPosture.actionNote}</p>
          </div>
          <div className="admin-surface-soft rounded-xl px-4 py-4">
            <SupportReplyComposer
              ticketId={ticket.ticket_id}
              currentModeLabel={actionPosture.actionStatusLabel}
              suggestedStatus={actionPosture.nextReplyStatus}
              suggestedStatusLabel={actionPosture.nextReplyStatusLabel}
              actionNote={actionPosture.actionNote}
              serverActionReady={actionPosture.serverActionReady}
            />
          </div>
          <div className="admin-surface-soft rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Internal Notes
            </p>
            <div className="mt-3">
              <SupportNoteComposer ticketId={ticket.ticket_id} />
            </div>
          </div>
          <div className="admin-surface-soft rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Handoff Queue
            </p>
            <div className="mt-3">
              <SupportHandoffQueueForm
                ticketId={ticket.ticket_id}
                relatedModule={ticket.related_module}
                hasAccount={Boolean(ticket.account_id)}
                hasCommission={Boolean(ticket.commission_id || ticket.account_id)}
                hasFinanceRecord={Boolean(ticket.ledger_ref || ticket.rebate_record_id || ticket.account_id)}
              />
            </div>
          </div>
        </div>
      </DataPanel>
    </div>
  );
}
