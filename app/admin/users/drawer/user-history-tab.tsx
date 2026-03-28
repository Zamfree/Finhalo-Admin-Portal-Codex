import { DataPanel } from "@/components/system/data/data-panel";
import type { UserOperationalHistory } from "../_types";

export function UserHistoryTab({ history }: { history: UserOperationalHistory | null }) {
  const operations = history?.operations ?? [];
  const logins = history?.logins ?? [];

  return (
    <div className="space-y-4">
      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">User Operations</h3>}
        description="Admin-side operation timeline for this user."
      >
        {operations.length === 0 ? (
          <p className="text-sm text-zinc-500">No operation entries yet.</p>
        ) : (
          <div className="space-y-3">
            {operations.map((entry) => (
              <div key={entry.id} className="admin-surface-soft rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{entry.action}</p>
                  <p className="text-xs font-mono text-zinc-500">{new Date(entry.created_at).toLocaleString()}</p>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {entry.actor} · {entry.scope}
                </p>
                <p className="mt-2 break-words text-sm text-zinc-300">{entry.detail}</p>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Login History</h3>}
        description="Recent login records for the selected user."
      >
        {logins.length === 0 ? (
          <p className="text-sm text-zinc-500">No login entries yet.</p>
        ) : (
          <div className="space-y-3">
            {logins.map((entry) => (
              <div key={entry.id} className="admin-surface-soft rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{entry.status.toUpperCase()}</p>
                  <p className="text-xs font-mono text-zinc-500">{new Date(entry.created_at).toLocaleString()}</p>
                </div>
                <p className="mt-2 text-xs text-zinc-400">IP: {entry.ip_address}</p>
                <p className="mt-1 break-words text-sm text-zinc-300">{entry.device}</p>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}

