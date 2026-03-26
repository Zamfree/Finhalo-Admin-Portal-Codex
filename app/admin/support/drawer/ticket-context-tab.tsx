import { DataPanel } from "@/components/system/data/data-panel";
import type { ReactNode } from "react";
import type { SupportTicket } from "../_types";

export function TicketContextTab({
  ticket,
  t,
}: {
  ticket: SupportTicket;
  t: (key: string) => string;
}) {
  const linkedReferences = [
    ticket.account_id,
    ticket.commission_id,
    ticket.rebate_record_id,
    ticket.ledger_ref,
    ticket.withdrawal_id,
  ].filter(Boolean).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <DataPanel
        title={
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Requester / Account Context
          </h3>
        }
        description={
          <p className="break-words text-sm text-zinc-400">
            Start with the requester and account anchor before moving into downstream records.
          </p>
        }
      >
        <dl className="space-y-4 text-sm">
          <DetailItem label={t("support.requesterLabel")} value={ticket.user_id} mono />
          <DetailItem label={t("support.email")} value={ticket.user_email} />
          <DetailItem
            label={t("common.labels.accountId")}
            value={ticket.account_id ?? t("common.empty.dash")}
            mono
          />
        </dl>
      </DataPanel>

      <DataPanel
        title={
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Operational References
          </h3>
        }
        description={
          <p className="break-words text-sm text-zinc-400">
            These references define the scope of the investigation across account, commission,
            rebate, finance, or withdrawal records.
          </p>
        }
      >
        <dl className="space-y-4 text-sm">
          <DetailItem
            label={t("support.relatedModule")}
            value={ticket.related_module ?? t("common.empty.dash")}
          />
          <DetailItem label="Linked References" value={String(linkedReferences)} />
          <DetailItem
            label={t("support.commissionId")}
            value={ticket.commission_id ?? t("common.empty.dash")}
            mono
          />
          <DetailItem
            label={t("support.rebateRecordId")}
            value={ticket.rebate_record_id ?? t("common.empty.dash")}
            mono
          />
          <DetailItem
            label={t("support.ledgerRef")}
            value={ticket.ledger_ref ?? t("common.empty.dash")}
            mono
          />
          <DetailItem
            label={t("support.withdrawalId")}
            value={ticket.withdrawal_id ?? t("common.empty.dash")}
            mono
          />
        </dl>
      </DataPanel>
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
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </dt>
      <dd
        className={mono ? "min-w-0 break-all font-mono text-sm text-zinc-300" : "min-w-0 break-words text-sm text-zinc-300"}
      >
        {value}
      </dd>
    </div>
  );
}
