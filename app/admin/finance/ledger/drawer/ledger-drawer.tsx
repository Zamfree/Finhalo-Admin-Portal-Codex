"use client";

import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { DrawerTabs } from "@/components/system/drawer/drawer-tabs";
import { getLedgerDrawerTabLabel } from "../../_config";
import { LEDGER_DRAWER_TABS } from "../../_constants";
import type { LedgerDrawerTab, LedgerRow } from "../../_types";
import { LedgerContextTab } from "./ledger-context-tab";
import { LedgerHandoffTab } from "./ledger-handoff-tab";
import { LedgerOverviewTab } from "./ledger-overview-tab";
import { LedgerReferencesTab } from "./ledger-references-tab";

export function LedgerDrawer({
  entry,
  open,
  activeTab,
  onChangeTab,
  onClose,
  onOpenChange,
}: {
  entry: LedgerRow | null;
  open: boolean;
  activeTab: LedgerDrawerTab;
  onChangeTab: (tab: LedgerDrawerTab) => void;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AppDrawer open={open} onOpenChange={onOpenChange} title={entry?.ledger_ref ?? "Ledger Detail"} width="wide">
      {entry ? (
        <>
          <DrawerHeader
            title={entry.ledger_ref}
            description={`${entry.beneficiary} | ${entry.entry_type}`}
            onClose={onClose}
          />
          <DrawerDivider />
          <DrawerTabs
            tabs={LEDGER_DRAWER_TABS}
            activeTab={activeTab}
            onChange={onChangeTab}
            getLabel={getLedgerDrawerTabLabel}
          />
          <DrawerDivider />
          <DrawerBody>
            {activeTab === "overview" ? (
              <LedgerOverviewTab entry={entry} />
            ) : activeTab === "context" ? (
              <LedgerContextTab entry={entry} />
            ) : activeTab === "references" ? (
              <LedgerReferencesTab entry={entry} />
            ) : (
              <LedgerHandoffTab entry={entry} />
            )}
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Handoff</p>
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
