export type BrokerStatus = "active" | "inactive";

export type BrokerRow = {
  broker_id: string;
  broker_name: string;
  status: BrokerStatus;
  accounts: number;
  created_at: string;
};