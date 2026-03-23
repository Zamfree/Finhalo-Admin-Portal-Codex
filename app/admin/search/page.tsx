"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DataPanel } from "@/components/system/data/data-panel";

type UserResult = {
  user_id: string;
  email: string;
};

type TradingAccountResult = {
  account_id: string;
  account_number: string;
  user_id: string;
};

type CommissionBatchResult = {
  batch_id: string;
  broker: string;
  status: string;
};

type WithdrawalResult = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
};

const MOCK_USERS: UserResult[] = [
  { user_id: "USR-1001", email: "alex@finhalo.test" },
  { user_id: "USR-1002", email: "mia@finhalo.test" },
  { user_id: "USR-1004", email: "olivia@finhalo.test" },
];

const MOCK_TRADING_ACCOUNTS: TradingAccountResult[] = [
  { account_id: "ACC-2001", account_number: "8800123", user_id: "USR-1001" },
  { account_id: "ACC-2002", account_number: "8800456", user_id: "USR-1002" },
  { account_id: "ACC-2003", account_number: "8800789", user_id: "USR-1003" },
];

const MOCK_BATCHES: CommissionBatchResult[] = [
  { batch_id: "BATCH-2401", broker: "BrokerOne", status: "approved" },
  { batch_id: "BATCH-2402", broker: "Prime Markets", status: "pending" },
  { batch_id: "BATCH-2403", broker: "Vertex Trade", status: "pending" },
];

const MOCK_WITHDRAWALS: WithdrawalResult[] = [
  { id: "WDL-3001", user_id: "USR-1001", amount: 120, status: "pending" },
  { id: "WDL-3002", user_id: "USR-1002", amount: 250, status: "approved" },
  { id: "WDL-3003", user_id: "USR-1003", amount: 80, status: "rejected" },
];

function ResultPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <DataPanel
      title={<h2 className="text-xl font-semibold text-white">{title}</h2>}
      className="bg-zinc-900/30"
    >
      {children}
    </DataPanel>
  );
}

function ResultList({
  children,
}: {
  children: ReactNode;
}) {
  return <ul className="space-y-3 text-sm">{children}</ul>;
}

function ResultLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-lg px-1 text-zinc-200 transition hover:text-white"
    >
      {children}
    </Link>
  );
}

export default function AdminSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const users = useMemo(
    () =>
      MOCK_USERS.filter((user) =>
        !query
          ? true
          : user.user_id.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
      ),
    [query]
  );

  const tradingAccounts = useMemo(
    () =>
      MOCK_TRADING_ACCOUNTS.filter((account) =>
        !query
          ? true
          : account.account_id.toLowerCase().includes(query) ||
            account.account_number.toLowerCase().includes(query) ||
            account.user_id.toLowerCase().includes(query)
      ),
    [query]
  );

  const commissionBatches = useMemo(
    () =>
      MOCK_BATCHES.filter((batch) =>
        !query
          ? true
          : batch.batch_id.toLowerCase().includes(query) ||
            batch.broker.toLowerCase().includes(query) ||
            batch.status.toLowerCase().includes(query)
      ),
    [query]
  );

  const withdrawals = useMemo(
    () =>
      MOCK_WITHDRAWALS.filter((withdrawal) =>
        !query
          ? true
          : withdrawal.id.toLowerCase().includes(query) ||
            withdrawal.user_id.toLowerCase().includes(query) ||
            withdrawal.status.toLowerCase().includes(query) ||
            withdrawal.amount.toString().includes(query)
      ),
    [query]
  );

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Search
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Global Search
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Search results are powered from the shared topbar search.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ResultPanel title="Users">
          <ResultList>
            {users.map((user) => (
              <li key={user.user_id}>
                <ResultLink href={`/admin/users/${user.user_id}`}>
                  {user.user_id} - {user.email}
                </ResultLink>
              </li>
            ))}
          </ResultList>
        </ResultPanel>

        <ResultPanel title="Trading Accounts">
          <ResultList>
            {tradingAccounts.map((account) => (
              <li key={account.account_id}>
                <ResultLink href={`/admin/accounts/${account.account_id}`}>
                  {account.account_number} (Account ID: {account.account_id})
                </ResultLink>
              </li>
            ))}
          </ResultList>
        </ResultPanel>

        <ResultPanel title="Commission Batches">
          <ResultList>
            {commissionBatches.map((batch) => (
              <li key={batch.batch_id}>
                <ResultLink href={`/admin/commission/batches/${batch.batch_id}`}>
                  {batch.batch_id} - {batch.broker} ({batch.status})
                </ResultLink>
              </li>
            ))}
          </ResultList>
        </ResultPanel>

        <ResultPanel title="Withdrawals">
          <ResultList>
            {withdrawals.map((withdrawal) => (
              <li key={withdrawal.id}>
                <ResultLink href="/admin/finance/withdrawals">
                  {withdrawal.id} - {withdrawal.user_id} ({withdrawal.status},{" "}
                  {withdrawal.amount.toLocaleString()})
                </ResultLink>
              </li>
            ))}
          </ResultList>
        </ResultPanel>
      </div>
    </div>
  );
}
