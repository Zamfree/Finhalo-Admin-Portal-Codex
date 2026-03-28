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

import { createUserAction, updateUserAction, type UserMutationState } from "./actions";
import type { UserRow } from "./_types";

const INITIAL_STATE: UserMutationState = {};

export function UserMutationDrawer({
  mode,
  user,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  user?: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [createState, createFormAction, isCreatePending] = useActionState(
    createUserAction,
    INITIAL_STATE
  );
  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateUserAction,
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

  if (isEditMode && !user) {
    return null;
  }

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? `Edit ${user?.display_name ?? ""}` : "Create User"}
      width="narrow"
    >
      <DrawerHeader
        title={isEditMode ? "Edit User" : "Create User"}
        description={
          isEditMode
            ? "Update profile, user type, and status."
            : "Create a new admin-visible user profile."
        }
        onClose={() => onOpenChange(false)}
      />
      <DrawerDivider />
      <DrawerBody>
        <form action={formAction} className="space-y-4">
          {isEditMode ? (
            <input type="hidden" name="user_id" value={user?.user_id ?? ""} />
          ) : (
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                User ID
              </span>
              <input
                name="user_id"
                required
                placeholder="USR-1007"
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              defaultValue={user?.email ?? ""}
              disabled={isEditMode}
              placeholder="user@example.com"
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 disabled:opacity-70"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Display Name
            </span>
            <input
              name="display_name"
              required
              defaultValue={user?.display_name ?? ""}
              placeholder="User display name"
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                User Type
              </span>
              <select
                name="user_type"
                defaultValue={user?.user_type ?? "trader"}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              >
                <option value="trader">trader</option>
                <option value="ib">ib</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Status
              </span>
              <select
                name="status"
                defaultValue={user?.status ?? "active"}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              >
                <option value="active">active</option>
                <option value="restricted">restricted</option>
                <option value="suspended">suspended</option>
              </select>
            </label>
          </div>

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
              disabled={isPending}
              onClick={() => onOpenChange(false)}
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
                  : "Create User"}
            </AdminButton>
          </DrawerFooter>
        </form>
      </DrawerBody>
    </AppDrawer>
  );
}

