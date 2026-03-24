import { MOCK_BROKERS } from "./_mock-data";
import { SummaryCard } from "./_shared";
import { BrokersPageClient } from "./brokers-page-client";

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
        <SummaryCard label="Total Brokers" value={totalBrokers} emphasis="strong" />
        <SummaryCard label="Active Brokers" value={activeBrokers} />
        <SummaryCard label="Inactive Brokers" value={inactiveBrokers} />
        <SummaryCard label="Total Linked Accounts" value={totalLinkedAccounts} />
      </div>
      <BrokersPageClient rows={MOCK_BROKERS} />
    </div>
  );
}
