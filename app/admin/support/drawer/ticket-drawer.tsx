"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { getSupportDrawerTabLabel } from "../_config";
import { SUPPORT_DRAWER_TABS } from "../_constants";
import type { SupportDrawerTab, SupportTicket, SupportTicketTimelineItem } from "../_types";
import { TicketContextTab } from "./ticket-context-tab";
import { TicketHandoffTab } from "./ticket-handoff-tab";
import { TicketOverviewTab } from "./ticket-overview-tab";
import { TicketTimelineTab } from "./ticket-timeline-tab";

export function TicketDrawer({
  ticket,
  timeline,
  open,
  activeTab,
  onChangeTab,
  onClose,
  onOpenChange,
  t,
}: {
  ticket: SupportTicket | null;
  timeline: SupportTicketTimelineItem[];
  open: boolean;
  activeTab: SupportDrawerTab;
  onChangeTab: (tab: SupportDrawerTab) => void;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  t: (key: string) => string;
}) {
  return (
        <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={ticket?.ticket_id ?? t("support.ticketId")}
      width="wide"
    >
      {ticket ? (
        <>
          <DrawerHeader
            title={ticket.subject}
            description={`${ticket.ticket_id} | ${ticket.related_module ?? "support"} | investigation case`}
            onClose={onClose}
          />
          <DrawerDivider />
          <DrawerTabs
            tabs={SUPPORT_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={getSupportDrawerTabLabel}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? (
              <TicketOverviewTab ticket={ticket} t={t} />
            ) : activeTab === "context" ? (
              <TicketContextTab ticket={ticket} t={t} />
            ) : activeTab === "timeline" ? (
              <TicketTimelineTab ticket={ticket} timeline={timeline} />
            ) : (
              <TicketHandoffTab ticket={ticket} t={t} />
            )}
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Investigation drawer
            </p>
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
