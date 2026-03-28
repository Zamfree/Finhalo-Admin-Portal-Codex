"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { CAMPAIGN_DRAWER_TABS } from "../_constants";
import type { CampaignRecord } from "../_types";
import { CampaignHandoffTab } from "./campaign-handoff-tab";
import { CampaignOverviewTab } from "./campaign-overview-tab";
import { CampaignPerformanceTab } from "./campaign-performance-tab";
import { CampaignRulesTab } from "./campaign-rules-tab";
import { CampaignTargetingTab } from "./campaign-targeting-tab";

export function CampaignDrawer({
  campaign,
  open,
  activeTab,
  onEdit,
  onOpenChange,
  onClose,
  onChangeTab,
}: {
  campaign: CampaignRecord | null;
  open: boolean;
  activeTab: (typeof CAMPAIGN_DRAWER_TABS)[number];
  onEdit?: () => void;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onChangeTab: (tab: (typeof CAMPAIGN_DRAWER_TABS)[number]) => void;
}) {
  return (
    <AppDrawer open={open && !!campaign} onOpenChange={onOpenChange} title={campaign?.name ?? "Campaign"} width="wide">
      {campaign ? (
        <>
          <DrawerHeader
            title={campaign.name}
            description={`${campaign.type} | ${campaign.status}`}
            onClose={onClose}
          />
          <DrawerTabs
            tabs={CAMPAIGN_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={(tab) => {
              if (tab === "overview") return "Overview";
              if (tab === "targeting") return "Targeting";
              if (tab === "rules") return "Rules";
              if (tab === "performance") return "Performance";
              return "Handoff";
            }}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? <CampaignOverviewTab campaign={campaign} /> : null}
            {activeTab === "targeting" ? <CampaignTargetingTab campaign={campaign} /> : null}
            {activeTab === "rules" ? <CampaignRulesTab campaign={campaign} /> : null}
            {activeTab === "performance" ? <CampaignPerformanceTab campaign={campaign} /> : null}
            {activeTab === "handoff" ? <CampaignHandoffTab campaign={campaign} /> : null}
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Campaign Operations
            </p>
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="admin-interactive h-10 rounded-xl px-4 text-sm font-medium text-zinc-200"
              >
                Edit Campaign
              </button>
            ) : null}
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
