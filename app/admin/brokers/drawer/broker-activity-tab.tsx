import { BrokerRelatedActivityPanel } from "../_shared";
import type { BrokerListRow } from "../_types";

export function BrokerActivityTab({ broker }: { broker: BrokerListRow }) {
  return <BrokerRelatedActivityPanel broker={broker} />;
}
