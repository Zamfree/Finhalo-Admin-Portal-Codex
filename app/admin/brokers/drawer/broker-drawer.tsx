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
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { AdminButton } from "@/components/system/actions/admin-button";
import { setBrokerStatusAction, type BrokerMutationState } from "../actions";
import { getBrokerDrawerTabLabel } from "../_config";
import { BROKER_DRAWER_TABS } from "../_constants";
import type { BrokerDrawerTab, BrokerListRow } from "../_types";
import { BrokerActivityTab } from "./broker-activity-tab";
import { BrokerContextTab } from "./broker-context-tab";
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
            ) : null}
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Quick Entry
            </p>
            <ReturnContextLink href={`/admin/brokers/${broker.broker_id}`}>
              <AdminButton variant="ghost" className="h-10 px-4">
                Open Broker Page
              </AdminButton>
            </ReturnContextLink>
            <ReturnContextLink
              href="/admin/commission"
              query={{ broker: broker.broker_name }}
            >
              <AdminButton variant="secondary" className="h-10 px-4">
                View Commission
              </AdminButton>
            </ReturnContextLink>
            {onEdit ? (
              <AdminButton variant="ghost" className="h-10 px-4" onClick={onEdit}>
                Edit Broker
              </AdminButton>
            ) : null}
            {broker ? (
              <form action={statusAction}>
                <input type="hidden" name="broker_id" value={broker.broker_id} />
                <input
                  type="hidden"
                  name="status"
                  value={broker.status === "active" ? "inactive" : "active"}
                />
                <AdminButton
                  type="submit"
                  disabled={isStatusPending}
                  variant="ghost"
                  className="h-10 px-4"
                >
                  {isStatusPending
                    ? "Updating..."
                    : broker.status === "active"
                      ? "Disable"
                      : "Enable"}
                </AdminButton>
              </form>
            ) : null}
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
