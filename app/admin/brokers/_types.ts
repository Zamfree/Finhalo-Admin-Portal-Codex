export type BrokerListRow = {
  broker_id: string;
  broker_name: string;
  status: "active" | "inactive";
  accounts: number;
  created_at: string;
  commission_batches: number;
  latest_batch_id: string | null;
};
