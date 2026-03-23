import { BrokersPageClient, type BrokerListRow } from "./brokers-page-client";

const MOCK_BROKERS: BrokerListRow[] = [
  {
    broker_id: "BRK-1001",
    broker_name: "IC Markets",
    status: "active",
    accounts: 128,
    created_at: "2026-02-01T10:30:00Z",
    commission_batches: 18,
    latest_batch_id: "BAT-2401",
  },
  {
    broker_id: "BRK-1002",
    broker_name: "Pepperstone",
    status: "active",
    accounts: 94,
    created_at: "2026-02-03T08:14:00Z",
    commission_batches: 14,
    latest_batch_id: "BAT-2412",
  },
  {
    broker_id: "BRK-1003",
    broker_name: "XM",
    status: "inactive",
    accounts: 61,
    created_at: "2026-02-06T13:55:00Z",
    commission_batches: 9,
    latest_batch_id: "BAT-2398",
  },
  {
    broker_id: "BRK-1004",
    broker_name: "Exness",
    status: "active",
    accounts: 142,
    created_at: "2026-02-12T11:45:00Z",
    commission_batches: 21,
    latest_batch_id: "BAT-2417",
  },
  {
    broker_id: "BRK-1005",
    broker_name: "FXTM",
    status: "inactive",
    accounts: 37,
    created_at: "2026-02-15T09:41:00Z",
    commission_batches: 6,
    latest_batch_id: null,
  },
  {
    broker_id: "BRK-1006",
    broker_name: "Axi",
    status: "active",
    accounts: 73,
    created_at: "2026-02-17T15:20:00Z",
    commission_batches: 11,
    latest_batch_id: "BAT-2415",
  },
];
export default function BrokersPage() {
  const totalBrokers = MOCK_BROKERS.length;
  const activeBrokers = MOCK_BROKERS.filter((broker) => broker.status === "active").length;
  const inactiveBrokers = MOCK_BROKERS.filter((broker) => broker.status === "inactive").length;
  const totalLinkedAccounts = MOCK_BROKERS.reduce((sum, broker) => sum + broker.accounts, 0);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Brokers
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Brokers<span className="ml-1.5 inline-block text-sky-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Manage broker partners and review current broker status.
        </p>
      </div>
      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="admin-surface-soft rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Total Brokers
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-white">{totalBrokers}</p>
        </div>
        <div className="admin-surface-soft rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Active Brokers
          </p>
          <p className="mt-2 text-lg font-semibold tabular-nums text-white">{activeBrokers}</p>
        </div>
        <div className="admin-surface-soft rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Inactive Brokers
          </p>
          <p className="mt-2 text-lg font-semibold tabular-nums text-white">{inactiveBrokers}</p>
        </div>
        <div className="admin-surface-soft rounded-2xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Total Linked Accounts
          </p>
          <p className="mt-2 text-lg font-semibold tabular-nums text-white">{totalLinkedAccounts}</p>
        </div>
      </div>
      <BrokersPageClient rows={MOCK_BROKERS} />
    </div>
  );
}
