import { DataPanel } from "@/components/system/data/data-panel";

export function UserActivityTab({
  activity,
}: {
  activity: {
    commission_summary: string;
    finance_summary: string;
    rebate_summary: string;
  };
}) {
  return (
    <DataPanel
      title={
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Related Activity
        </h3>
      }
      description="These summaries reflect downstream activity tied to the user's owned trading accounts."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="admin-surface-soft rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Commission
          </p>
          <p className="mt-2 text-sm text-zinc-300">{activity.commission_summary}</p>
        </div>
        <div className="admin-surface-soft rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Finance
          </p>
          <p className="mt-2 text-sm text-zinc-300">{activity.finance_summary}</p>
        </div>
        <div className="admin-surface-soft rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Rebate
          </p>
          <p className="mt-2 text-sm text-zinc-300">{activity.rebate_summary}</p>
        </div>
      </div>
    </DataPanel>
  );
}
