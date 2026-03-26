"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { getBrokerDrawerTabLabel } from "../_config";
import { BROKER_DRAWER_TABS } from "../_constants";
import type { BrokerDrawerTab, BrokerListRow } from "../_types";
import { BrokerActivityTab } from "./broker-activity-tab";
import { BrokerContextTab } from "./broker-context-tab";
import { BrokerHandoffTab } from "./broker-handoff-tab";
import { BrokerOverviewTab } from "./broker-overview-tab";

export function BrokerDrawer({
  broker,
  open,
  activeTab,
  onChangeTab,
  onClose,
  onOpenChange,
}: {
  broker: BrokerListRow | null;
  open: boolean;
  activeTab: BrokerDrawerTab;
  onChangeTab: (tab: BrokerDrawerTab) => void;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
}) {
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
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
