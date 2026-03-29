import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { formatAmount } from "../../_shared";
import type { WithdrawalRow } from "../../_types";
import { WithdrawalWorkOrderSummary } from "./withdrawal-work-order-summary";

function formatDateTime(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}

function getEventTone(nextStatus: string) {
  if (nextStatus === "completed") return "text-emerald-300";
  if (nextStatus === "processing") return "text-indigo-300";
  if (nextStatus === "approved") return "text-emerald-200";
  if (nextStatus === "under_review") return "text-sky-300";
  if (nextStatus === "requested") return "text-amber-300";
  if (nextStatus === "rejected" || nextStatus === "failed") return "text-rose-300";
  if (nextStatus === "cancelled") return "text-zinc-300";
  return "text-zinc-300";
}

export function WithdrawalReferencesTab({ withdrawal }: { withdrawal: WithdrawalRow }) {
  const events = [...(withdrawal.events ?? [])].sort((a, b) => {
    const aTime = Date.parse(a.created_at);
    const bTime = Date.parse(b.created_at);
    return (Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0);
  });
  const linkedLedgerEntries = withdrawal.linked_ledger_entries ?? [];
  const reserveCount = linkedLedgerEntries.filter((entry) =>
    entry.transaction_type.toLowerCase().includes("reserve")
  ).length;
  const releaseCount = linkedLedgerEntries.filter((entry) =>
    entry.transaction_type.toLowerCase().includes("release")
  ).length;
  const payoutCount = linkedLedgerEntries.filter((entry) =>
    entry.transaction_type.toLowerCase().includes("payout")
  ).length;

  return (
    <div className="space-y-4">
      <WithdrawalWorkOrderSummary withdrawal={withdrawal} />
      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">References</h3>}
      >
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Wallet Address" value={withdrawal.wallet_address} mono />
          <DetailItem label="Payout Method" value={withdrawal.payout_method} />
          <DetailItem label="Account ID" value={withdrawal.account_id} mono />
          <DetailItem label="Reserve Ledger Ref" value={withdrawal.reserve_ledger_ref ?? "-"} mono />
          <DetailItem label="Release Ledger Ref" value={withdrawal.release_ledger_ref ?? "-"} mono />
          <DetailItem label="Payout Ledger Ref" value={withdrawal.payout_ledger_ref ?? "-"} mono />
          <DetailItem label="Idempotency Key" value={withdrawal.idempotency_key ?? "-"} mono />
          <DetailItem label="Relationship Snapshot ID" value={withdrawal.relationship_snapshot_id ?? "-"} mono />
        </dl>
      </DataPanel>

      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Status History</h3>}
      >
        <div className="mb-3 grid gap-2 md:grid-cols-4">
          <MetricCard label="Events" value={events.length.toString()} />
          <MetricCard label="Reserve Entries" value={reserveCount.toString()} />
          <MetricCard label="Release Entries" value={releaseCount.toString()} />
          <MetricCard label="Payout Entries" value={payoutCount.toString()} />
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-zinc-500">No workflow events recorded for this withdrawal.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div
                key={event.event_id}
                className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2"
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${getEventTone(event.next_status)}`}>
                  #{index + 1} {event.previous_status ?? "null"} {"->"} {event.next_status}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  at{" "}
                  {formatDateTime(event.created_at)}
                </p>
                <p className="text-xs text-zinc-500">
                  actor={event.actor ?? "-"} | reason={event.reason ?? "-"}
                </p>
                {event.notes ? <p className="mt-1 text-xs text-zinc-400">{event.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Linked Ledger Entries</h3>}
      >
        {linkedLedgerEntries.length === 0 ? (
          <p className="text-sm text-zinc-500">No ledger entries linked yet.</p>
        ) : (
          <div className="space-y-2">
            {linkedLedgerEntries.map((entry) => (
              <div
                key={`${entry.ledger_ref}:${entry.reference_id ?? "none"}`}
                className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2"
              >
                <p className="font-mono text-xs text-zinc-300">{entry.ledger_ref}</p>
                <p className="text-xs text-zinc-400">
                  {entry.transaction_type} | {entry.direction} | {entry.status} |{" "}
                  {formatAmount(entry.amount, entry.direction === "debit" ? "negative" : "positive")}
                </p>
                <p className="text-xs text-zinc-500">
                  ref={entry.reference_id ?? "-"} | currency={entry.currency ?? "-"} |{" "}
                  {formatDateTime(entry.created_at)}
                </p>
                {entry.memo ? <p className="mt-1 text-xs text-zinc-400">{entry.memo}</p> : null}
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-300">{value}</p>
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
    <div className="space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd className={mono ? "break-all font-mono text-sm text-zinc-300" : "text-sm text-zinc-300"}>
        {value}
      </dd>
    </div>
  );
}
