"use client";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
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
  const commissionQuery = ticket?.account_id
    ? { query: ticket.account_id }
    : ticket
      ? { query: ticket.user_id }
      : undefined;
  const financeQuery = ticket?.ledger_ref
    ? { ledger_ref: ticket.ledger_ref }
    : ticket?.rebate_record_id
      ? { rebate_record_id: ticket.rebate_record_id }
      : ticket?.account_id
        ? { account_id: ticket.account_id }
        : ticket
          ? { user_id: ticket.user_id }
          : undefined;

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
            ) : null}
          </DrawerBody>
          <DrawerDivider />
          <DrawerBody>
            <TicketHandoffTab ticket={ticket} t={t} showQuickLinks={false} />
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Quick Entry
            </p>
            <ReturnContextLink href={`/admin/users/${ticket.user_id}`}>
              <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
            </ReturnContextLink>
            {ticket.account_id ? (
              <ReturnContextLink href={`/admin/accounts/${ticket.account_id}`}>
                <AdminButton variant="secondary">{t("common.actions.viewAccount")}</AdminButton>
              </ReturnContextLink>
            ) : (
              <AdminButton
                variant="secondary"
                disabled
                title="No linked account is available for this case."
              >
                {t("common.actions.viewAccount")}
              </AdminButton>
            )}
            {commissionQuery ? (
              <ReturnContextLink href="/admin/commission" query={commissionQuery}>
                <AdminButton variant="ghost">{t("common.actions.viewCommission")}</AdminButton>
              </ReturnContextLink>
            ) : null}
            {financeQuery ? (
              <ReturnContextLink href="/admin/finance/ledger" query={financeQuery}>
                <AdminButton variant="ghost">{t("common.actions.viewFinance")}</AdminButton>
              </ReturnContextLink>
            ) : null}
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
