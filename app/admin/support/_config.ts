import type { SupportDrawerTab } from "./_types";

export const SUPPORT_DRAWER_QUERY_CONFIG = {
  detailKey: "detail_ticket_id",
  tabKey: "drawer",
} as const;

export function getSupportDrawerTabLabel(tab: SupportDrawerTab) {
  switch (tab) {
    case "overview":
      return "Overview";
    case "context":
      return "Context";
    case "timeline":
      return "Timeline";
    default:
      return tab;
  }
}
