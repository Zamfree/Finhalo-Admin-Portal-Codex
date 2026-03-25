import type { IbRelationshipSnapshot } from "./network";

export type TradingAccountStatus = "active" | "monitoring" | "suspended";

export type TradingAccount = {
  accountId: string;
  ownerUserId: string;
  ownerEmail: string;
  ownerDisplayName?: string | null;
  brokerName: string;
  accountType: "standard" | "raw" | "pro";
  status: TradingAccountStatus;
  createdAt: string;
  currentRelationship: IbRelationshipSnapshot;
  relationshipHistory: IbRelationshipSnapshot[];
};
