import { WithdrawalActions } from "@/components/finance/withdrawal-actions";

type WithdrawalRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
};

const MOCK_WITHDRAWALS: WithdrawalRow[] = [
  { id: "WDL-3001", user_id: "USR-1001", amount: 120, status: "pending", created_at: "2026-03-19T10:15:00Z" },
  { id: "WDL-3002", user_id: "USR-1002", amount: 250, status: "approved", created_at: "2026-03-19T09:20:00Z" },
  { id: "WDL-3003", user_id: "USR-1003", amount: 80, status: "rejected", created_at: "2026-03-18T21:45:00Z" },
];

export default async function WithdrawalsPage() {
  const withdrawals = MOCK_WITHDRAWALS;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Withdrawals</h1>
            <p className="text-sm text-muted-foreground">Static withdrawal workflow preview for admin review.</p>
          </div>
          <button type="button" className="rounded-md border px-3 py-2 text-xs text-muted-foreground" disabled>
            Bulk review (Preview)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">User ID</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Created At</th>
                <th className="py-2 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{withdrawal.user_id}</td>
                  <td className="py-2 pr-4">{Number(withdrawal.amount).toLocaleString()}</td>
                  <td className="py-2 pr-4">{withdrawal.status}</td>
                  <td className="py-2 pr-4">{new Date(withdrawal.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    <WithdrawalActions withdrawalId={withdrawal.id} status={withdrawal.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
