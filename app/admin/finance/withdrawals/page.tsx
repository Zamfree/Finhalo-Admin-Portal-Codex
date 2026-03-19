import { WithdrawalActions } from "@/components/finance/withdrawal-actions";
import { createClient } from "@/lib/supabase/server";

type WithdrawalRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
};

async function getWithdrawals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("withdrawals")
    .select(`
      id,
      user_id,
      amount,
      status,
      created_at,
      profiles (
        full_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching withdrawals:", error);
    return [];
  }

  return (data as unknown as WithdrawalRow[] | null) ?? [];
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
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Created At</th>
                <th className="py-2 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <div className="font-medium">{withdrawal.profiles?.full_name ?? "Unknown User"}</div>
                    <div className="text-xs text-muted-foreground">{withdrawal.user_id}</div>
                  </td>
                  <td className="py-2 pr-4 font-mono">{Number(withdrawal.amount).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        withdrawal.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : withdrawal.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </td>
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
