import Link from "next/link";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import type { BrokerListRow } from "../_types";

export function BrokerHandoffTab({ broker }: { broker: BrokerListRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Handoff</h3>}
      description={
        <p className="text-sm text-zinc-400">
          Move from broker context into the broker detail page or downstream commission review.
        </p>
      }
    >
      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/brokers/${broker.broker_id}`}>
          <AdminButton variant="ghost">Open Broker Page</AdminButton>
        </Link>
        <Link href={`/admin/commission?broker=${encodeURIComponent(broker.broker_name)}`}>
          <AdminButton variant="secondary">View Commission Center</AdminButton>
        </Link>
      </div>
    </DataPanel>
  );
}
