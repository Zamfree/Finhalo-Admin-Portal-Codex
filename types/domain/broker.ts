export type BrokerStatus = "active" | "inactive";

export type Broker = {
  brokerId: string;
  brokerName: string;
  status: BrokerStatus;
  linkedAccounts: number;
  createdAt: string;
};
