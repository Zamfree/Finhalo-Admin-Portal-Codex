"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";

import {
  createBrokerAction,
  updateBrokerAction,
  type BrokerMutationState,
} from "./actions";
import type { BrokerListRow } from "./_types";

const INITIAL_STATE: BrokerMutationState = {};

export function BrokerMutationDrawer({
  mode,
  broker,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  broker?: BrokerListRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [createState, createFormAction, isCreatePending] = useActionState(
    createBrokerAction,
    INITIAL_STATE
  );
  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateBrokerAction,
    INITIAL_STATE
  );

  const isEditMode = mode === "edit";
  const state = isEditMode ? updateState : createState;
  const formAction = isEditMode ? updateFormAction : createFormAction;
  const isPending = isEditMode ? isUpdatePending : isCreatePending;

  useEffect(() => {
    if (!state.success) {
      return;
    }

    onOpenChange(false);
    router.refresh();
  }, [onOpenChange, router, state.success]);

  if (isEditMode && !broker) {
    return null;
  }

  const brokerId = broker?.broker_id ?? "";
  const brokerName = broker?.broker_name ?? "";
  const status = broker?.status ?? "active";

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? `Edit ${brokerName || brokerId}` : "Add Broker"}
      width="narrow"
    >
      <DrawerHeader
        title={isEditMode ? "Edit Broker" : "Add Broker"}
        description={
          isEditMode
            ? "Update broker name and status."
            : "Create a broker record for intake and operational review."
        }
        onClose={() => onOpenChange(false)}
      />
      <DrawerDivider />
      <DrawerBody>
        <form action={formAction} className="space-y-4">
          {isEditMode ? (
            <>
              <input type="hidden" name="broker_id" value={brokerId} />
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Broker ID
                </label>
                <p className="admin-control h-11 w-full rounded-xl px-4 py-3 font-mono text-sm text-zinc-300">
                  {brokerId}
                </p>
              </div>
            </>
          ) : (
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Broker ID
              </span>
              <input
                name="broker_id"
                required
                placeholder="BRK-1007"
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Broker Name
            </span>
            <input
              name="broker_name"
              required
              defaultValue={brokerName}
              placeholder="Broker display name"
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Status
            </span>
            <select
              name="status"
              defaultValue={status}
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          {state.error ? (
            <p className="break-words text-sm text-rose-300" aria-live="polite">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="break-words text-sm text-emerald-300" aria-live="polite">
              {state.success}
            </p>
          ) : null}

          <DrawerDivider className="my-1" />
          <DrawerFooter className="px-0 py-0">
            <AdminButton
              type="button"
              variant="ghost"
              className="h-11 px-5"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" className="h-11 px-5" disabled={isPending}>
              {isPending
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Broker"}
            </AdminButton>
          </DrawerFooter>
        </form>
      </DrawerBody>
    </AppDrawer>
  );
}

