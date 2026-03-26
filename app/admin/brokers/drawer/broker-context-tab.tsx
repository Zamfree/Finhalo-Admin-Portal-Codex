import { BrokerContextPanel } from "../_shared";
import type { BrokerListRow } from "../_types";

export function BrokerContextTab({ broker }: { broker: BrokerListRow }) {
  return <BrokerContextPanel broker={broker} />;
}
