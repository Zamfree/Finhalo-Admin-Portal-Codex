import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type AccountDetailProps = {
  params: Promise<{
    account_id: string;
  }>;
};

type AccountActivityRow = {
  id: string;
  type: string;
  amount: number;
  created_at: string;
};

const MOCK_ACCOUNT_DETAIL = {
  account_number: "8800123",
  user_id: "USR-1001",
  broker: "BrokerOne",
  status: "active",
  leverage: "1:200",
  equity: 1350.2,
};

const MOCK_ACCOUNT_ACTIVITY: AccountActivityRow[] = [
  { id: "ACT-9101", type: "commission", amount: 18.75, created_at: "2026-03-18T11:20:00Z" },
  { id: "ACT-9102", type: "rebate", amount: 6.25, created_at: "2026-03-18T12:15:00Z" },
  { id: "ACT-9103", type: "withdrawal", amount: -50, created_at: "2026-03-19T08:01:00Z" },
];

const activityColumns: DataTableColumn<AccountActivityRow>[] = [
  {
    key: "id",
    header: "Activity ID",
    cell: (activity) => activity.id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-400",
  },
  {
    key: "type",
    header: "Type",
    cell: (activity) => (
      <span className="text-xs uppercase tracking-[0.12em] text-zinc-300">
        {activity.type}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    cell: (activity) => activity.amount.toLocaleString(),
    headerClassName:
      "py-2.5 pr-6 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-6 text-right tabular-nums text-white",
  },
  {
    key: "created_at",
    header: "Created At",
    cell: (activity) => new Date(activity.created_at).toLocaleString(),
    headerClassName:
      "py-2.5 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0 text-sm text-zinc-400",
  },
];

export default async function AccountDetailPage({ params }: AccountDetailProps) {
  const { account_id } = await params;

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Accounts
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Account Detail
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Preview-mode account profile and activity summary.
        </p>
      </section>

      <DataPanel title={<h2 className="text-xl font-semibold text-white">Account Summary</h2>}>
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Account ID
            </dt>
            <dd className="mt-2 font-mono text-zinc-200">{account_id}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Account Number
            </dt>
            <dd className="mt-2 text-zinc-200">{MOCK_ACCOUNT_DETAIL.account_number}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              User ID
            </dt>
            <dd className="mt-2 font-mono text-zinc-200">{MOCK_ACCOUNT_DETAIL.user_id}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Broker
            </dt>
            <dd className="mt-2 text-zinc-200">{MOCK_ACCOUNT_DETAIL.broker}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Status
            </dt>
            <dd className="mt-2 text-zinc-200">{MOCK_ACCOUNT_DETAIL.status}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Leverage
            </dt>
            <dd className="mt-2 text-zinc-200">{MOCK_ACCOUNT_DETAIL.leverage}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Equity
            </dt>
            <dd className="mt-2 text-zinc-200">
              {MOCK_ACCOUNT_DETAIL.equity.toLocaleString()}
            </dd>
          </div>
        </dl>
      </DataPanel>

      <DataPanel title={<h2 className="text-xl font-semibold text-white">Recent Activity</h2>}>
        <DataTable
          columns={activityColumns}
          rows={MOCK_ACCOUNT_ACTIVITY}
          getRowKey={(activity) => activity.id}
          minWidthClassName="min-w-[720px]"
        />
      </DataPanel>
    </div>
  );
}
