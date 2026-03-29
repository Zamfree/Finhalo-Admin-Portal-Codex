import { getClientWithdrawalWorkspace } from "@/services/client/withdrawal.service";
import { WithdrawalsPageClient } from "./withdrawals-page-client";

export default async function WithdrawalsPage() {
  const workspace = await getClientWithdrawalWorkspace();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Client / Withdrawals</p>
        <h1 className="text-3xl font-semibold text-white">Withdrawals</h1>
        <p className="max-w-3xl text-sm text-zinc-400">
          Submit withdrawal requests, review net payout, and track processing status. Financial eligibility and hold checks
          are enforced server-side from ledger truth.
        </p>
      </header>

      <WithdrawalsPageClient workspace={workspace} />
    </main>
  );
}
