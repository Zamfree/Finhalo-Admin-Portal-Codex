import Link from "next/link";

import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type AccountRow = {
  account_id: string;
  account_number: string;
  user_id: string;
  status: "active" | "inactive";
  broker: string;
};

const MOCK_ACCOUNTS: AccountRow[] = [
  {
    account_id: "ACC-2001",
    account_number: "8800123",
    user_id: "USR-1001",
    status: "active",
    broker: "BrokerOne",
  },
  {
    account_id: "ACC-2002",
    account_number: "8800456",
    user_id: "USR-1002",
    status: "active",
    broker: "Prime Markets",
  },
  {
    account_id: "ACC-2003",
    account_number: "8800789",
    user_id: "USR-1003",
    status: "inactive",
    broker: "Vertex Trade",
  },
];

function getStatusClass(status: AccountRow["status"]) {
  return status === "active"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
}

const accountColumns: DataTableColumn<AccountRow>[] = [
  {
    key: "account_id",
    header: "Account ID",
    cell: (account) => account.account_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-400",
  },
  {
    key: "account_number",
    header: "Account Number",
    cell: (account) => account.account_number,
    cellClassName: "py-3 pr-6 text-white",
  },
  {
    key: "user_id",
    header: "User ID",
    cell: (account) => account.user_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-300",
  },
  {
    key: "broker",
    header: "Broker",
    cell: (account) => account.broker,
  },
  {
    key: "status",
    header: "Status",
    cell: (account) => (
      <span
        className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusClass(
          account.status
        )}`}
      >
        {account.status}
      </span>
    ),
  },
  {
    key: "action",
    header: "Action",
    cell: (account) => (
      <Link
        href={`/admin/accounts/${account.account_id}`}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 hover:text-white"
      >
        View detail
      </Link>
    ),
    headerClassName:
      "py-2.5 pr-0 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0 text-right align-middle",
  },
];

export default async function AccountsPage() {
  return (
    <div className="space-y-6 pb-8">
      <DataPanel
        title={
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Directory
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Trading Accounts
            </h1>
          </div>
        }
        description={
          <p className="text-sm text-zinc-400">
            Preview-mode account list for UI shell validation.
          </p>
        }
      >
        <DataTable
          columns={accountColumns}
          rows={MOCK_ACCOUNTS}
          getRowKey={(account) => account.account_id}
          minWidthClassName="min-w-[780px]"
        />
      </DataPanel>
    </div>
  );
}
