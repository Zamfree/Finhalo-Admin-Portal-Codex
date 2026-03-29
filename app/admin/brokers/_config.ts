import type { BrokerDrawerTab } from "./_types";

export const BROKER_DRAWER_QUERY_CONFIG = {
  detailKey: "detail_broker_id",
  tabKey: "drawer",
} as const;

export function getBrokerDrawerTabLabel(tab: BrokerDrawerTab) {
  switch (tab) {
    case "overview":
      return "Overview";
    case "context":
      return "Context";
    case "activity":
      return "Activity";
    default:
      return tab;
  }
}
