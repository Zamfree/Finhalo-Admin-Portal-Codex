import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import { UnavailableHint } from "@/components/system/feedback/unavailable-hint";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminSupportTicketDetail } from "@/services/admin/support.service";

import { getSupportWorkflow } from "../_mappers";
import { SummaryCard, getPriorityClass, getStatusClass } from "../_shared";
import { SupportNoteComposer } from "../support-note-composer";
import { SupportReplyComposer } from "../support-reply-composer";

type TicketDetailProps = {
  params: Promise<{
    ticket_id: string;
  }>;
};

function displayValue(value?: string | null) {
  return value ?? "—";
}

export default async function SupportTicketDetailPage({ params }: TicketDetailProps) {
  const { ticket_id } = await params;
  const { ticket, timeline } = await getAdminSupportTicketDetail(ticket_id);

  if (!ticket) {
    notFound();
  }

  const commissionHref = ticket.account_id
    ? `/admin/commission?account_id=${encodeURIComponent(ticket.account_id)}`
    : null;
  const financeHref = ticket.ledger_ref
    ? `/admin/finance/ledger?ledger_ref=${encodeURIComponent(ticket.ledger_ref)}`
    : ticket.rebate_record_id
      ? `/admin/finance/ledger?rebate_record_id=${encodeURIComponent(ticket.rebate_record_id)}`
      : ticket.account_id
        ? `/admin/finance/ledger?account_id=${encodeURIComponent(ticket.account_id)}`
        : null;

  const linkedReferences = [
    ticket.account_id,
    ticket.commission_id,
    ticket.rebate_record_id,
    ticket.ledger_ref,
    ticket.withdrawal_id,
  ].filter(Boolean).length;

  const workflow = getSupportWorkflow(ticket);

  return (
    <div className="space-y-5 pb-8 xl:space-y-6">
      <PageHeader
        eyebrow="Admin / Support"
        title={ticket.subject}
        description="Review ticket context, respond, and hand off only when linked records are available."
        accentClassName="bg-violet-400"
        actions={
          <ReturnToContextButton
            fallbackPath="/admin/support"
            label="Back to Support"
            variant="ghost"
            className="px-3 py-2"
          />
        }
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Status" value={ticket.status.replace("_", " ")} emphasis="strong" />
        <SummaryCard label="Priority" value={ticket.priority} />
        <SummaryCard label="Current Stage" value={workflow.currentStageLabel} />
        <SummaryCard label="Linked References" value={linkedReferences} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)] xl:items-start">
        <div className="space-y-6">
          <DataPanel title={<h2 className="text-xl font-semibold text-white">Conversation</h2>}>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <div
                  className="admin-surface-soft rounded-xl p-6 text-sm text-zinc-500"
                  role="status"
                  aria-live="polite"
                >
                  No case activity is available yet.
                </div>
              ) : (
                timeline.map((message) => (
                  <article
                    key={message.message_id}
                    className={`admin-surface-soft space-y-3 rounded-xl p-4 text-sm ${
                      message.author_type === "admin"
                        ? "border-white/10 bg-white/[0.05]"
                        : message.author_type === "system"
                          ? "bg-white/[0.03]"
                          : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                          {message.author_type}
                        </p>
                        {message.is_internal ? (
                          <StatusBadge toneClassName="bg-amber-500/10 text-amber-300">
                            Internal
                          </StatusBadge>
                        ) : null}
                      </div>
                      <p className="break-words text-xs text-zinc-500">
                        {message.author_name} · {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="break-words whitespace-pre-wrap text-zinc-200">{message.body}</p>
                  </article>
                ))
              )}
            </div>
          </DataPanel>

          <div className="grid gap-5 2xl:grid-cols-2">
            <DataPanel title={<h2 className="text-xl font-semibold text-white">Reply</h2>}>
              <SupportReplyComposer
                ticketId={ticket.ticket_id}
                currentModeLabel={ticket.status.replace("_", " ")}
                suggestedStatus={ticket.status === "closed" ? "closed" : "pending"}
                suggestedStatusLabel={ticket.status === "closed" ? "Closed" : "Pending"}
                actionNote={workflow.nextAction}
                serverActionReady={ticket.status !== "closed"}
              />
            </DataPanel>

            <DataPanel title={<h2 className="text-xl font-semibold text-white">Internal Notes</h2>}>
              <SupportNoteComposer ticketId={ticket.ticket_id} />
            </DataPanel>
          </div>
        </div>

        <div className="space-y-5 xl:sticky xl:top-6">
          <DataPanel title={<h2 className="text-xl font-semibold text-white">Case Context</h2>}>
            <dl className="grid grid-cols-1 gap-4 text-sm">
              <DetailItem label="Ticket ID" value={ticket.ticket_id} mono />
              <DetailItem
                label="Status"
                value={
                  <StatusBadge toneClassName={getStatusClass(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </StatusBadge>
                }
              />
              <DetailItem
                label="Priority"
                value={
                  <StatusBadge toneClassName={getPriorityClass(ticket.priority)}>
                    {ticket.priority}
                  </StatusBadge>
                }
              />
              <DetailItem label="Requester" value={ticket.user_id} mono />
              <DetailItem label="Email" value={ticket.user_email} />
              <DetailItem label="Linked Account" value={displayValue(ticket.account_id)} mono />
              <DetailItem label="Related Module" value={displayValue(ticket.related_module)} />
              <DetailItem label="Current Stage" value={workflow.currentStageLabel} />
              <DetailItem label="Next Action" value={workflow.nextAction} />
            </dl>
          </DataPanel>

          <DataPanel title={<h2 className="text-xl font-semibold text-white">Record Links</h2>}>
            <div className="space-y-3">
              {[
                { label: "Account ID", value: ticket.account_id },
                { label: "Commission ID", value: ticket.commission_id },
                { label: "Rebate Record ID", value: ticket.rebate_record_id },
                { label: "Ledger Ref", value: ticket.ledger_ref },
                { label: "Withdrawal ID", value: ticket.withdrawal_id },
              ].map((item) => (
                <div
                  key={item.label}
                  className="admin-surface-soft flex flex-wrap items-center justify-between gap-4 rounded-xl p-4"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="break-all font-mono text-sm text-zinc-200">{displayValue(item.value)}</p>
                </div>
              ))}
            </div>
          </DataPanel>

          <DataPanel title={<h2 className="text-xl font-semibold text-white">Handoff</h2>}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <ReturnContextLink href={`/admin/users/${ticket.user_id}`}>
                  <AdminButton variant="ghost" className="h-11 px-5">
                    View User
                  </AdminButton>
                </ReturnContextLink>
                {ticket.account_id ? (
                  <ReturnContextLink href={`/admin/accounts/${ticket.account_id}`}>
                    <AdminButton variant="secondary" className="h-11 px-5">
                      View Account
                    </AdminButton>
                  </ReturnContextLink>
                ) : (
                  <AdminButton
                    variant="secondary"
                    className="h-11 px-5"
                    disabled
                    title="No linked account is available for this case."
                  >
                    View Account
                  </AdminButton>
                )}
                {commissionHref ? (
                  <ReturnContextLink href={commissionHref}>
                    <AdminButton variant="ghost" className="h-11 px-5">
                      View Commission
                    </AdminButton>
                  </ReturnContextLink>
                ) : (
                  <AdminButton
                    variant="ghost"
                    className="h-11 px-5"
                    disabled
                    title="Commission review needs linked account context."
                  >
                    View Commission
                  </AdminButton>
                )}
                {financeHref ? (
                  <ReturnContextLink href={financeHref}>
                    <AdminButton variant="primary" className="h-11 px-5">
                      View Finance
                    </AdminButton>
                  </ReturnContextLink>
                ) : (
                  <AdminButton
                    variant="primary"
                    className="h-11 px-5"
                    disabled
                    title="No finance-facing record is linked to this case yet."
                  >
                    View Finance
                  </AdminButton>
                )}
              </div>
              {!ticket.account_id || !commissionHref || !financeHref ? (
                <UnavailableHint>
                  Some handoff actions stay disabled until the ticket is linked to the required records.
                </UnavailableHint>
              ) : null}
            </div>
          </DataPanel>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</dt>
      <dd className={`mt-2 min-w-0 ${mono ? "break-all font-mono" : "break-words"} text-zinc-200`}>
        {value}
      </dd>
    </div>
  );
}
