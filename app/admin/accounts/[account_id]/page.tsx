type AccountDetailProps = {
  params: Promise<{
    account_id: string;
  }>;
};

const MOCK_ACCOUNT_DETAIL = {
  account_number: "8800123",
  user_id: "USR-1001",
  broker: "BrokerOne",
  status: "active",
  leverage: "1:200",
  equity: 1350.2,
};

const MOCK_ACCOUNT_ACTIVITY = [
  { id: "ACT-9101", type: "commission", amount: 18.75, created_at: "2026-03-18T11:20:00Z" },
  { id: "ACT-9102", type: "rebate", amount: 6.25, created_at: "2026-03-18T12:15:00Z" },
  { id: "ACT-9103", type: "withdrawal", amount: -50, created_at: "2026-03-19T08:01:00Z" },
];

export default async function AccountDetailPage({ params }: AccountDetailProps) {
  const { account_id } = await params;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-semibold">Account Detail</h1>
        <p className="text-sm text-muted-foreground">Preview-mode account profile and activity summary.</p>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Account Summary</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Account ID</dt>
            <dd>{account_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Account Number</dt>
            <dd>{MOCK_ACCOUNT_DETAIL.account_number}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd>{MOCK_ACCOUNT_DETAIL.user_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Broker</dt>
            <dd>{MOCK_ACCOUNT_DETAIL.broker}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{MOCK_ACCOUNT_DETAIL.status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Leverage</dt>
            <dd>{MOCK_ACCOUNT_DETAIL.leverage}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Equity</dt>
            <dd>{MOCK_ACCOUNT_DETAIL.equity.toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Activity ID</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACCOUNT_ACTIVITY.map((activity) => (
                <tr key={activity.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{activity.id}</td>
                  <td className="py-2 pr-4">{activity.type}</td>
                  <td className="py-2 pr-4">{activity.amount.toLocaleString()}</td>
                  <td className="py-2 pr-4">{new Date(activity.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
