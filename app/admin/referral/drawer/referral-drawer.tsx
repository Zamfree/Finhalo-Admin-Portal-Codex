"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import { DrawerBody, DrawerDivider, DrawerHeader } from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { REFERRAL_DRAWER_TABS } from "../_constants";
import type { ReferralRecord } from "../_types";
import { ReferralHandoffTab } from "./referral-handoff-tab";
import { ReferralOverviewTab } from "./referral-overview-tab";
import { ReferralPerformanceTab } from "./referral-performance-tab";
import { ReferralRulesTab } from "./referral-rules-tab";

export function ReferralDrawer({
  referral,
  open,
  activeTab,
  onOpenChange,
  onClose,
  onChangeTab,
}: {
  referral: ReferralRecord | null;
  open: boolean;
  activeTab: (typeof REFERRAL_DRAWER_TABS)[number];
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onChangeTab: (tab: (typeof REFERRAL_DRAWER_TABS)[number]) => void;
}) {
  return (
    <AppDrawer open={open && !!referral} onOpenChange={onOpenChange} title={referral?.name ?? "Referral"} width="wide">
      {referral ? (
        <>
          <DrawerHeader
            title={referral.name}
            description={`${referral.reward_model} | ${referral.status}`}
            onClose={onClose}
          />
          <DrawerTabs
            tabs={REFERRAL_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={(tab) => {
              if (tab === "overview") return "Overview";
              if (tab === "rules") return "Rules";
              if (tab === "performance") return "Performance";
              return "Handoff";
            }}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? <ReferralOverviewTab referral={referral} /> : null}
            {activeTab === "rules" ? <ReferralRulesTab referral={referral} /> : null}
            {activeTab === "performance" ? <ReferralPerformanceTab referral={referral} /> : null}
            {activeTab === "handoff" ? <ReferralHandoffTab referral={referral} /> : null}
          </DrawerBody>
        </>
      ) : null}
    </AppDrawer>
  );
}
