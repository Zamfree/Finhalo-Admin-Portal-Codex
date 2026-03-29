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
import { getLedgerDrawerTabLabel } from "../../_config";
import { LEDGER_DRAWER_TABS } from "../../_constants";
import type { LedgerDrawerTab, LedgerRow } from "../../_types";
import { LedgerContextTab } from "./ledger-context-tab";
import { LedgerOverviewTab } from "./ledger-overview-tab";
import { LedgerReferencesTab } from "./ledger-references-tab";

function resolveBatchId(entry: LedgerRow) {
  if (entry.source_batch_id) {
    return entry.source_batch_id;
  }

  if (entry.reference_type !== "commission_batch_approval" || !entry.reference_id) {
    return null;
  }

  const [batchId] = entry.reference_id.split(":");
  return batchId || null;
}

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
  const batchId = entry ? resolveBatchId(entry) : null;
  const hasAccount = entry?.account_id && entry.account_id !== "-";

  return (
    <AppDrawer open={open} onOpenChange={onOpenChange} title={entry?.ledger_ref ?? "Ledger Detail"} width="wide">
      {entry ? (
        <>
          <DrawerHeader
            title={entry.ledger_ref}
            description={`${entry.user_display ?? entry.beneficiary} | ${entry.source_summary}`}
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
            ) : null}
          </DrawerBody>
          <DrawerDivider />
          <DrawerFooter>
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Quick Entry
            </p>
            {entry.user_id ? (
              <ReturnContextLink href={`/admin/users/${entry.user_id}`}>
                <AdminButton variant="ghost">View User</AdminButton>
              </ReturnContextLink>
            ) : null}
            {hasAccount ? (
              <ReturnContextLink href={`/admin/accounts/${entry.account_id}`}>
                <AdminButton variant="secondary">View Account</AdminButton>
              </ReturnContextLink>
            ) : null}
            {batchId ? (
              <ReturnContextLink href={`/admin/commission/batches/${batchId}`}>
                <AdminButton variant="ghost">View Batch</AdminButton>
              </ReturnContextLink>
            ) : null}
            {entry.related_withdrawal_id ? (
              <ReturnContextLink href="/admin/finance/withdrawals" query={{ query: entry.related_withdrawal_id }}>
                <AdminButton variant="ghost">View Withdrawal</AdminButton>
              </ReturnContextLink>
            ) : null}
            {entry.related_rebate_record ? (
              <ReturnContextLink href="/admin/finance/ledger" query={{ rebate_record_id: entry.related_rebate_record }}>
                <AdminButton variant="ghost">Trace Rebate</AdminButton>
              </ReturnContextLink>
            ) : null}
          </DrawerFooter>
        </>
      ) : null}
    </AppDrawer>
  );
}
