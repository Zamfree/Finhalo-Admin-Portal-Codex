"use client";

import { useActionState, useMemo } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";

import {
  applyUserSafetyLockAction,
  clearUserSafetyLockAction,
  setUserRebatePermissionAction,
  type UserMutationState,
} from "../actions";
import type { UserRow } from "../_types";

const INITIAL_STATE: UserMutationState = {};

function formatLockState(value: string | null | undefined) {
  if (!value) {
    return "No active lock";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function UserRiskControls({ user }: { user: UserRow }) {
  const [applyState, applyFormAction, isApplyPending] = useActionState(
    applyUserSafetyLockAction,
    INITIAL_STATE
  );
  const [clearState, clearFormAction, isClearPending] = useActionState(
    clearUserSafetyLockAction,
    INITIAL_STATE
  );
  const [rebateState, rebateFormAction, isRebatePending] = useActionState(
    setUserRebatePermissionAction,
    INITIAL_STATE
  );
  const lockLabel = useMemo(() => formatLockState(user.safety_lock_until), [user.safety_lock_until]);
  const rebateStatus =
    user.rebate_enabled === null || user.rebate_enabled === undefined
      ? "Unknown"
      : user.rebate_enabled
        ? "Enabled"
        : "Disabled";

  return (
    <div className="space-y-4">
      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">12-Hour Lock</h3>}
        description="Admin intervention control for temporary safety lock."
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Current lock until: <span className="font-mono text-zinc-200">{lockLabel}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={applyFormAction}>
              <input type="hidden" name="user_id" value={user.user_id} />
              <AdminButton type="submit" variant="secondary" className="h-10 px-4" disabled={isApplyPending}>
                {isApplyPending ? "Applying..." : "Apply 12h Lock"}
              </AdminButton>
            </form>
            <form action={clearFormAction}>
              <input type="hidden" name="user_id" value={user.user_id} />
              <AdminButton type="submit" variant="ghost" className="h-10 px-4" disabled={isClearPending}>
                {isClearPending ? "Clearing..." : "Clear Lock"}
              </AdminButton>
            </form>
          </div>
          {applyState.error || clearState.error ? (
            <p className="break-words text-xs text-rose-300">{applyState.error ?? clearState.error}</p>
          ) : null}
          {applyState.success || clearState.success ? (
            <p className="break-words text-xs text-emerald-300">{applyState.success ?? clearState.success}</p>
          ) : null}
        </div>
      </DataPanel>

      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Rebate Permission</h3>}
        description="Control whether this user can receive rebate flow."
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Current permission: <span className="font-medium text-zinc-200">{rebateStatus}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={rebateFormAction}>
              <input type="hidden" name="user_id" value={user.user_id} />
              <input type="hidden" name="enabled" value="true" />
              <AdminButton type="submit" variant="secondary" className="h-10 px-4" disabled={isRebatePending}>
                Enable Rebate
              </AdminButton>
            </form>
            <form action={rebateFormAction}>
              <input type="hidden" name="user_id" value={user.user_id} />
              <input type="hidden" name="enabled" value="false" />
              <AdminButton type="submit" variant="ghost" className="h-10 px-4" disabled={isRebatePending}>
                Disable Rebate
              </AdminButton>
            </form>
          </div>
          {rebateState.error ? (
            <p className="break-words text-xs text-rose-300">{rebateState.error}</p>
          ) : null}
          {rebateState.success ? (
            <p className="break-words text-xs text-emerald-300">{rebateState.success}</p>
          ) : null}
        </div>
      </DataPanel>
    </div>
  );
}

