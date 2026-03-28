"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { setBrokerStatusAction, type BrokerMutationState } from "../actions";
import { getBrokerDrawerTabLabel } from "../_config";
import { BROKER_DRAWER_TABS } from "../_constants";
import type { BrokerDrawerTab, BrokerListRow } from "../_types";
import { BrokerActivityTab } from "./broker-activity-tab";
import { BrokerContextTab } from "./broker-context-tab";
import { BrokerHandoffTab } from "./broker-handoff-tab";
import { BrokerOverviewTab } from "./broker-overview-tab";

const INITIAL_STATE: BrokerMutationState = {};

export function BrokerDrawer({
  broker,
  open,
  activeTab,
  onChangeTab,
  onEdit,
  onClose,
  onOpenChange,
}: {
  broker: BrokerListRow | null;
  open: boolean;
  activeTab: BrokerDrawerTab;
  onChangeTab: (tab: BrokerDrawerTab) => void;
  onEdit?: () => void;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [statusState, statusAction, isStatusPending] = useActionState(
    setBrokerStatusAction,
    INITIAL_STATE
  );

  useEffect(() => {
    if (!statusState.success) {
      return;
    }

    router.refresh();
  }, [router, statusState.success]);

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={broker?.broker_name ?? "Broker Detail"}
      width="wide"
    >
      {broker ? (
        <>
          <DrawerHeader
            title={broker.broker_name}
            description={`${broker.broker_id} | broker operations`}
            onClose={onClose}
          />
          <DrawerDivider />
          <DrawerTabs
            tabs={BROKER_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={getBrokerDrawerTabLabel}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? (
              <BrokerOverviewTab broker={broker} />
            ) : activeTab === "context" ? (
              <BrokerContextTab broker={broker} />
            ) : activeTab === "activity" ? (
              <BrokerActivityTab broker={broker} />
            ) : (
              <BrokerHandoffTab broker={broker} />
            )}
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Handoff
            </p>
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="admin-interactive h-10 rounded-xl px-4 text-sm font-medium text-zinc-200"
              >
                Edit Broker
              </button>
            ) : null}
            {broker ? (
              <form action={statusAction}>
                <input type="hidden" name="broker_id" value={broker.broker_id} />
                <input
                  type="hidden"
                  name="status"
                  value={broker.status === "active" ? "inactive" : "active"}
                />
                <button
                  type="submit"
                  disabled={isStatusPending}
                  className="admin-interactive h-10 rounded-xl px-4 text-sm font-medium text-zinc-200 disabled:opacity-50"
                >
                  {isStatusPending
                    ? "Updating..."
                    : broker.status === "active"
                      ? "Disable"
                      : "Enable"}
                </button>
              </form>
            ) : null}
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
