"use client";

import { useActionState, useEffect, useMemo } from "react";
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
  createCampaignAction,
  type CampaignMutationState,
  updateCampaignAction,
} from "./actions";
import type { CampaignRecord } from "./_types";

const INITIAL_STATE: CampaignMutationState = {};

function toDateTimeLocal(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  const date = new Date(parsed);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function CampaignMutationDrawer({
  mode,
  campaign,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  campaign?: CampaignRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [createState, createFormAction, isCreatePending] = useActionState(
    createCampaignAction,
    INITIAL_STATE
  );
  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateCampaignAction,
    INITIAL_STATE
  );

  const isEditMode = mode === "edit";
  const state = isEditMode ? updateState : createState;
  const formAction = isEditMode ? updateFormAction : createFormAction;
  const isPending = isEditMode ? isUpdatePending : isCreatePending;

  const defaults = useMemo(() => {
    return {
      campaignId: campaign?.campaign_id ?? "",
      name: campaign?.name ?? "",
      type: campaign?.type ?? "trading",
      status: campaign?.status ?? "scheduled",
      rewardType: campaign?.reward_type ?? "",
      participants: String(campaign?.participants ?? 0),
      startAt: campaign ? toDateTimeLocal(campaign.start_at) : "",
      endAt: campaign ? toDateTimeLocal(campaign.end_at) : "",
      overview: campaign?.overview ?? "",
      targetingSummary: campaign?.targeting_summary ?? "",
      performanceSummary: campaign?.performance_summary ?? "",
      rulesText: campaign?.rules.join("\n") ?? "",
    };
  }, [campaign]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    onOpenChange(false);
    router.refresh();
  }, [onOpenChange, router, state.success]);

  if (isEditMode && !campaign) {
    return null;
  }

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? `Edit ${defaults.name || defaults.campaignId}` : "Create Campaign"}
      width="wide"
    >
      <DrawerHeader
        title={isEditMode ? "Edit Campaign" : "Create Campaign"}
        description={
          isEditMode
            ? "Update campaign details and operational rules."
            : "Create a campaign with details, targeting summary, and rules."
        }
        onClose={() => onOpenChange(false)}
      />
      <DrawerDivider />
      <DrawerBody>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {isEditMode ? (
              <>
                <input type="hidden" name="campaign_id" value={defaults.campaignId} />
                <label className="block space-y-1.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Campaign ID
                  </span>
                  <p className="admin-control h-11 w-full rounded-xl px-4 py-3 font-mono text-sm text-zinc-300">
                    {defaults.campaignId}
                  </p>
                </label>
              </>
            ) : (
              <label className="block space-y-1.5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Campaign ID (Optional)
                </span>
                <input
                  name="campaign_id"
                  placeholder="CMP-20260401-0001"
                  className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                />
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Campaign Name
              </span>
              <input
                name="name"
                required
                defaultValue={defaults.name}
                placeholder="Campaign Name"
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Type
              </span>
              <select
                name="type"
                defaultValue={defaults.type}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              >
                <option value="trading">trading</option>
                <option value="deposit">deposit</option>
                <option value="referral">referral</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Status
              </span>
              <select
                name="status"
                defaultValue={defaults.status}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              >
                <option value="scheduled">scheduled</option>
                <option value="active">active</option>
                <option value="ended">ended</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Participants
              </span>
              <input
                type="number"
                min={0}
                step={1}
                name="participants"
                defaultValue={defaults.participants}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Reward Type
              </span>
              <input
                name="reward_type"
                defaultValue={defaults.rewardType}
                placeholder="Reward model"
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Start At
              </span>
              <input
                type="datetime-local"
                name="start_at"
                defaultValue={defaults.startAt}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                End At
              </span>
              <input
                type="datetime-local"
                name="end_at"
                defaultValue={defaults.endAt}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Overview
            </span>
            <textarea
              name="overview"
              rows={3}
              defaultValue={defaults.overview}
              className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Targeting Summary
            </span>
            <textarea
              name="targeting_summary"
              rows={3}
              defaultValue={defaults.targetingSummary}
              className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Rules (one line per rule)
            </span>
            <textarea
              name="rules_text"
              rows={5}
              defaultValue={defaults.rulesText}
              className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Performance Summary
            </span>
            <textarea
              name="performance_summary"
              rows={3}
              defaultValue={defaults.performanceSummary}
              className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
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
                  : "Create Campaign"}
            </AdminButton>
          </DrawerFooter>
        </form>
      </DrawerBody>
    </AppDrawer>
  );
}
