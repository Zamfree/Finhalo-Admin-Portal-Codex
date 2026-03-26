"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";

import type { CommissionQueueWorkspace } from "./_types";
import { CommissionBatchesTableClient } from "./batches/batches-table-client";
import { BatchQueueDrawer } from "./batches/batch-queue-drawer";

export function CommissionPageClient({
  queueWorkspace,
}: {
  queueWorkspace: CommissionQueueWorkspace;
}) {
  const searchParams = useSearchParams();
  const [showAllBatches, setShowAllBatches] = useState(() => searchParams.get("show_all") === "1");
  const attentionRows = useMemo(
    () => queueWorkspace.items.filter((item) => item.workflow.needsReview),
    [queueWorkspace.items]
  );
  const visibleRows = useMemo(
    () => (showAllBatches ? queueWorkspace.items : attentionRows),
    [showAllBatches, queueWorkspace.items, attentionRows]
  );

  const drawerState = useDrawerQueryState({
    detailKey: "detail_batch_id",
    tabKey: "batch_drawer",
    defaultTab: "overview",
    validTabs: ["overview"] as const,
    items: queueWorkspace.items,
    getItemId: (item) => item.batch.batch_id,
  });

  return (
    <>
      <div
        className={`transition-[opacity,filter] duration-200 ease-out ${
          drawerState.isOpen ? "opacity-65 blur-[3px]" : "opacity-100 blur-0"
        }`}
      >
        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">Needs Attention ({attentionRows.length})</h2>}
          actions={
            <AdminButton
              variant="ghost"
              className="h-10 px-4"
              onClick={() => setShowAllBatches((current) => !current)}
            >
              {showAllBatches ? "Show Attention Only" : "Show All Batches"}
            </AdminButton>
          }
        >
          <CommissionBatchesTableClient
            rows={visibleRows}
            onRowClick={(row) => drawerState.openDrawer(row)}
          />
        </DataPanel>
      </div>

      <BatchQueueDrawer
        item={drawerState.selectedItem}
        profitThresholdPercent={queueWorkspace.profitThresholdPercent}
        open={drawerState.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            drawerState.closeDrawer();
          }
        }}
        onClose={drawerState.closeDrawer}
      />
    </>
  );
}
