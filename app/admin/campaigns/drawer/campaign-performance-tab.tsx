import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import type { CampaignParticipantRow, CampaignRecord } from "../_types";

function getParticipantStatusClass(status: CampaignParticipantRow["status"]) {
  if (status === "completed") {
    return "bg-emerald-500/10 text-emerald-300";
  }
  if (status === "qualified") {
    return "bg-blue-500/10 text-blue-300";
  }
  if (status === "disqualified") {
    return "bg-rose-500/10 text-rose-300";
  }
  return "bg-zinc-500/10 text-zinc-300";
}

const participantColumns: DataTableColumn<CampaignParticipantRow>[] = [
  {
    key: "participant",
    header: "Participant",
    cell: (row) => (
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{row.user_name}</p>
        <p className="font-mono text-xs text-zinc-500">{row.user_id}</p>
      </div>
    ),
    cellClassName: "py-3 pr-4",
    width: "26%",
  },
  {
    key: "account",
    header: "Account",
    cell: (row) => <span className="font-mono text-xs text-zinc-300">{row.account_id ?? "-"}</span>,
    cellClassName: "py-3 pr-4",
    width: "16%",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getParticipantStatusClass(
          row.status
        )}`}
      >
        {row.status}
      </span>
    ),
    cellClassName: "py-3 pr-4",
    width: "16%",
  },
  {
    key: "progress",
    header: "Progress",
    cell: (row) => (
      <div className="space-y-1">
        <p className="text-sm font-semibold tabular-nums text-white">{row.progress_percent}%</p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-sky-400/80"
            style={{ width: `${Math.max(0, Math.min(100, row.progress_percent))}%` }}
          />
        </div>
      </div>
    ),
    cellClassName: "py-3 pr-4",
    width: "22%",
  },
  {
    key: "updated_at",
    header: "Updated",
    cell: (row) => (
      <span className="text-xs text-zinc-400">{new Date(row.updated_at).toLocaleString()}</span>
    ),
    cellClassName: "py-3 pr-0",
    width: "20%",
  },
];

export function CampaignPerformanceTab({ campaign }: { campaign: CampaignRecord }) {
  const completedCount = campaign.participant_rows.filter((row) => row.status === "completed").length;
  const qualifiedCount = campaign.participant_rows.filter((row) => row.status === "qualified").length;
  const avgProgress =
    campaign.participant_rows.length > 0
      ? Math.round(
          campaign.participant_rows.reduce((sum, row) => sum + row.progress_percent, 0) /
            campaign.participant_rows.length
        )
      : 0;

  return (
    <div className="space-y-4">
      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Performance</h3>}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Participants" value={campaign.participants} />
          <MetricCard label="Completed" value={completedCount} />
          <MetricCard label="Qualified" value={qualifiedCount} />
          <MetricCard label="Avg Progress" value={`${avgProgress}%`} />
        </div>
        <p className="mt-4 text-sm text-zinc-300">{campaign.performance_summary}</p>
      </DataPanel>

      <DataPanel
        title={
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Participant List
          </h3>
        }
        description={
          <p className="text-sm text-zinc-400">
            Review participant status and completion progress for this campaign.
          </p>
        }
      >
        <DataTable
          columns={participantColumns}
          rows={campaign.participant_rows}
          getRowKey={(row) => row.participant_id}
          minWidthClassName="min-w-[980px]"
          emptyMessage="No participant records available."
          rowClassName="text-zinc-200 even:bg-white/[0.02] hover:bg-white/[0.04]"
        />
      </DataPanel>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="admin-surface-soft rounded-xl p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
