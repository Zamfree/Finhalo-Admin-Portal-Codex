import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import { getSupportActionPosture, getSupportWorkflow } from "../_mappers";
import { getPriorityClass, getStatusClass } from "../_shared";
import type { SupportTicket } from "../_types";

export function TicketOverviewTab({
  ticket,
  t,
}: {
  ticket: SupportTicket;
  t: (key: string) => string;
}) {
  const workflow = getSupportWorkflow(ticket);
  const actionPosture = getSupportActionPosture(ticket);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <DataPanel
        title={
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            {t("support.overviewTitle")}
          </h3>
        }
      >
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <DetailItem label={t("support.ticketId")} value={ticket.ticket_id} mono />
          <DetailItem label={t("support.subject")} value={ticket.subject} />
          <DetailItem
            label={t("common.labels.category")}
            value={t(`support.categoryOptions.${ticket.category}`)}
          />
          <DetailItem
            label={t("support.priority")}
            value={<StatusBadge toneClassName={getPriorityClass(ticket.priority)}>{ticket.priority}</StatusBadge>}
          />
          <DetailItem
            label={t("common.labels.status")}
            value={
              <StatusBadge toneClassName={getStatusClass(ticket.status)}>
                {t(`support.statusOptions.${ticket.status}`)}
              </StatusBadge>
            }
          />
          <DetailItem label="Current Stage" value={workflow.currentStageLabel} />
          <DetailItem label={t("common.labels.createdAt")} value={new Date(ticket.created_at).toLocaleString()} />
          <DetailItem label={t("common.labels.updatedAt")} value={new Date(ticket.updated_at).toLocaleString()} />
        </dl>
      </DataPanel>

      <DataPanel
        title={<h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Workflow</h3>}
        description={<p className="text-sm text-zinc-400">A quieter view of the current case position.</p>}
      >
        <div className="space-y-3">
          {workflow.stages.map((stage) => (
            <div
              key={stage.key}
              className={`rounded-xl px-4 py-3 text-sm ${
                stage.state === "current"
                  ? "admin-surface-soft bg-white/[0.04]"
                  : stage.state === "complete"
                    ? "admin-surface-soft bg-white/[0.02]"
                    : "admin-surface-soft"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="break-words font-medium text-white">{stage.label}</p>
                <span className="text-[10px] uppercase tracking-[0.08em] text-zinc-500">{stage.state}</span>
              </div>
              <p className="mt-2 break-words text-xs text-zinc-400">{stage.description}</p>
            </div>
          ))}

          <div className="rounded-xl bg-white/[0.02] px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">Next Action</p>
            <p className="mt-2 break-words text-sm text-zinc-300">{workflow.nextAction}</p>
          </div>
        </div>
      </DataPanel>

      <DataPanel
        title={<h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Reply Alignment</h3>}
        description={<p className="text-sm text-zinc-400">Keeps case state and reply state aligned.</p>}
      >
        <div className="space-y-3">
          <QuietInfoCard label="Current Action Mode" value={actionPosture.actionStatusLabel} />
          <QuietInfoCard label="Next Reply Status" value={actionPosture.nextReplyStatusLabel} />
          <div className="rounded-xl bg-white/[0.02] px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">Action Readiness</p>
            <p className="mt-2 text-sm text-zinc-300">
              {actionPosture.serverActionReady ? "Ready for reply workflow" : "Read-only until reopened"}
            </p>
            <p className="mt-2 break-words text-xs text-zinc-500">{actionPosture.actionNote}</p>
          </div>
        </div>
      </DataPanel>
    </div>
  );
}

function QuietInfoCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-sm text-zinc-300">{value}</p>
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
    <div className="min-w-0 space-y-2">
      <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
      <dd
        className={
          mono
            ? "min-w-0 break-all font-mono text-sm text-zinc-300"
            : "min-w-0 break-words text-sm text-zinc-300"
        }
      >
        {value}
      </dd>
    </div>
  );
}
