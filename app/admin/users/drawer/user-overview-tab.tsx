import { DataPanel } from "@/components/system/data/data-panel";
import type { UserRow } from "@/types/user";

function getStatusClass(status: UserRow["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "restricted") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export function UserOverviewTab({ user }: { user: UserRow }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <DataPanel
        title={
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Overview
          </h3>
        }
        description="Core identity and ownership information for the selected platform user."
      >
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Name
            </p>
            <p className="mt-2 text-sm font-medium text-white">{user.display_name}</p>
          </div>
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              User ID
            </p>
            <p className="mt-2 font-mono text-sm text-zinc-300">{user.user_id}</p>
          </div>
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Email
            </p>
            <p className="mt-2 text-sm text-white">{user.email}</p>
          </div>
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              User Type
            </p>
            <p className="mt-2 text-sm uppercase text-zinc-300">{user.user_type}</p>
          </div>
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Status
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                  user.status
                )}`}
              >
                {user.status}
              </span>
            </div>
          </div>
          <div className="admin-surface-soft rounded-xl p-4 md:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Created At
            </p>
            <p className="mt-2 text-sm text-zinc-300">{new Date(user.created_at).toLocaleString()}</p>
          </div>
        </div>
      </DataPanel>
    </div>
  );
}
