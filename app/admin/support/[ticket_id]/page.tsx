import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";

import { MOCK_SUPPORT_TICKETS, MOCK_SUPPORT_TICKET_TIMELINE } from "../_mock-data";

type TicketDetailProps = {
  params: Promise<{
    ticket_id: string;
  }>;
};

function getPriorityClass(priority: (typeof MOCK_SUPPORT_TICKETS)[number]["priority"]) {
  if (priority === "urgent") return "bg-rose-500/10 text-rose-300";
  if (priority === "high") return "bg-amber-500/10 text-amber-300";
  if (priority === "medium") return "bg-blue-500/10 text-blue-300";
  return "bg-zinc-500/10 text-zinc-300";
}

function getStatusClass(status: (typeof MOCK_SUPPORT_TICKETS)[number]["status"]) {
  if (status === "open") return "bg-white/[0.08] text-zinc-200";
  if (status === "in_progress") return "bg-white/[0.07] text-zinc-300";
  if (status === "waiting_user") return "bg-white/[0.06] text-zinc-300";
  if (status === "resolved") return "bg-white/[0.06] text-zinc-300";
  return "bg-white/[0.05] text-zinc-400";
}

export default async function SupportTicketDetailPage({ params }: TicketDetailProps) {
  const { ticket_id } = await params;
  const ticket = MOCK_SUPPORT_TICKETS.find((row) => row.ticket_id === ticket_id);

  if (!ticket) {
    notFound();
  }

  const timeline = MOCK_SUPPORT_TICKET_TIMELINE[ticket.ticket_id] ?? [];
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

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Support
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {ticket.subject}
          <span className="ml-1.5 inline-block text-violet-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Support ticket detail view with clear requester context, linked account references, and
          downstream handoff into related operational modules when record context exists.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DataPanel title={<h2 className="text-xl font-semibold text-white">Ticket Overview</h2>}>
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Ticket ID
              </dt>
              <dd className="mt-2 font-mono text-zinc-200">{ticket.ticket_id}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Subject
              </dt>
              <dd className="mt-2 text-zinc-200">{ticket.subject}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Category
              </dt>
              <dd className="mt-2 text-sm uppercase tracking-[0.12em] text-zinc-300">
                {ticket.category}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Priority
              </dt>
              <dd className="mt-2">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getPriorityClass(
                    ticket.priority
                  )}`}
                >
                  {ticket.priority}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Status
              </dt>
              <dd className="mt-2">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                    ticket.status
                  )}`}
                >
                  {ticket.status.replace("_", " ")}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Created At
              </dt>
              <dd className="mt-2 text-zinc-200">{new Date(ticket.created_at).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Updated At
              </dt>
              <dd className="mt-2 text-zinc-200">{new Date(ticket.updated_at).toLocaleString()}</dd>
            </div>
          </dl>
        </DataPanel>

        <DataPanel title={<h2 className="text-xl font-semibold text-white">Requester Context</h2>}>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                User / Requester
              </dt>
              <dd className="mt-2 font-mono text-zinc-200">{ticket.user_id}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Email
              </dt>
              <dd className="mt-2 text-zinc-200">{ticket.user_email}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Linked Account ID
              </dt>
              <dd className="mt-2 font-mono text-zinc-200">{ticket.account_id ?? "-"}</dd>
            </div>
          </dl>
        </DataPanel>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Related Context</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            Use these references to trace the ticket into the linked account, commission, rebate,
            finance, or withdrawal context when the record exists.
          </p>
        }
      >
        <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Related Module
            </p>
            <p className="mt-2 text-sm text-zinc-200">{ticket.related_module ?? "-"}</p>
          </div>
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
                className="admin-surface-soft flex items-center justify-between gap-4 rounded-xl p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {item.label}
                </p>
                <p className="font-mono text-sm text-zinc-200">{item.value ?? "-"}</p>
              </div>
            ))}
          </div>
        </div>
      </DataPanel>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Conversation / Timeline</h2>}
      >
        <div className="space-y-3">
          {timeline.length === 0 ? (
            <div className="admin-surface-soft rounded-xl p-6 text-sm text-zinc-500">
              No ticket timeline items are available for this mock ticket yet.
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {message.author_type}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {message.author_name} | {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-zinc-200">{message.body}</p>
              </article>
            ))
          )}
        </div>
      </DataPanel>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Navigation / Handoff</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            Move from the ticket into the linked owner, trading account, commission review, or
            finance record only when record context exists.
          </p>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Link href={`/admin/users/${ticket.user_id}`}>
            <AdminButton variant="ghost" className="h-11 px-5">
              View User
            </AdminButton>
          </Link>
          {ticket.account_id ? (
            <Link href={`/admin/accounts/${ticket.account_id}`}>
              <AdminButton variant="secondary" className="h-11 px-5">
                View Account
              </AdminButton>
            </Link>
          ) : (
            <AdminButton variant="secondary" className="h-11 px-5" disabled>
              View Account
            </AdminButton>
          )}
          {commissionHref ? (
            <Link href={commissionHref}>
              <AdminButton variant="ghost" className="h-11 px-5">
                View Commission
              </AdminButton>
            </Link>
          ) : (
            <AdminButton variant="ghost" className="h-11 px-5" disabled>
              View Commission
            </AdminButton>
          )}
          {financeHref ? (
            <Link href={financeHref}>
              <AdminButton variant="primary" className="h-11 px-5">
                View Finance
              </AdminButton>
            </Link>
          ) : (
            <AdminButton variant="primary" className="h-11 px-5" disabled>
              View Finance
            </AdminButton>
          )}
        </div>
      </DataPanel>
    </div>
  );
}
