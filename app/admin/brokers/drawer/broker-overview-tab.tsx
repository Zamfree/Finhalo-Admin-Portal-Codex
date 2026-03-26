import { BrokerOverviewPanel } from "../_shared";
import type { BrokerListRow } from "../_types";

export function BrokerOverviewTab({ broker }: { broker: BrokerListRow }) {
  return <BrokerOverviewPanel broker={broker} />;
}
