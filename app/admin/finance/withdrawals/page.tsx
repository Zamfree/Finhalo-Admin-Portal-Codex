import { WithdrawalActions } from "@/components/finance/withdrawal-actions";
import { supabaseServer } from "@/lib/supabase/server";

type WithdrawalRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
};

async function getWithdrawals() {
  const { data, error } = await supabaseServer
    .from("withdrawals")
    .select("id,user_id,amount,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data as WithdrawalRow[] | null) ?? [];
}

export default async function WithdrawalsPage() {
  const withdrawals = await getWithdrawals();

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Withdrawals</h1>

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

              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No withdrawals found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
