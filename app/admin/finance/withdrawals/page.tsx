import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

import { SummaryCard, formatAmount } from "../_shared";
import {
  WithdrawalsPageClient,
  type WithdrawalRow,
} from "./withdrawals-page-client";

const MOCK_WITHDRAWALS: WithdrawalRow[] = [
  {
    withdrawal_id: "WDL-3001",
    beneficiary: "alice@example.com",
    account_id: "ACC-2001",
    trader_user_id: "USR-1001",
    l1_ib_id: "IB-2101",
    l2_ib_id: null,
    relationship_snapshot_id: "REL-SNP-2001",
    amount: 120,
    fee: 4.5,
    status: "pending",
    requested_at: "2026-03-19T10:15:00Z",
    wallet_address: "0xA1f3...9912",
    network: "TRC20",
  },
  {
    withdrawal_id: "WDL-3002",
    beneficiary: "bob@example.com",
    account_id: "ACC-2002",
    trader_user_id: "USR-1002",
    l1_ib_id: "IB-2102",
    l2_ib_id: "IB-3101",
    relationship_snapshot_id: "REL-SNP-2002",
    amount: 250,
    fee: 6,
    status: "approved",
    requested_at: "2026-03-19T09:20:00Z",
    wallet_address: "0xB5c9...2210",
    network: "ERC20",
  },
  {
    withdrawal_id: "WDL-3003",
    beneficiary: "charlie@example.com",
    account_id: "ACC-2003",
    trader_user_id: "USR-1003",
    l1_ib_id: null,
    l2_ib_id: "IB-3102",
    relationship_snapshot_id: "REL-SNP-2003",
    amount: 80,
    fee: 3.25,
    status: "rejected",
    requested_at: "2026-03-18T21:45:00Z",
    wallet_address: "0xC9d1...8760",
    network: "BEP20",
  },
];

type WithdrawalsPageProps = {
  searchParams: Promise<{
    account_id?: string;
  }>;
};

export default async function WithdrawalsPage({ searchParams }: WithdrawalsPageProps) {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const { account_id } = await searchParams;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Withdrawals
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.withdrawals}<span className="ml-1.5 inline-block text-teal-300">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.withdrawalsDescription}</p>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.withdrawalPanelTitle}</h2>}
        description={
          <div className="max-w-2xl space-y-2 text-sm text-zinc-400">
            <p>{t.withdrawalPanelDescription}</p>
            <p className="text-zinc-500">{t.withdrawalPanelNote}</p>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <AdminButton variant="secondary" className="h-11 px-5">
              {translations.common.actions.batchApprove}
            </AdminButton>
            <AdminButton variant="destructive" className="h-11 px-5">
              {translations.common.actions.batchReject}
            </AdminButton>
          </div>
        }
        summary={
          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label={t.pendingWithdrawals}
              value={MOCK_WITHDRAWALS.filter((row) => row.status === "pending").length}
              emphasis="strong"
            />
            <SummaryCard
              label={t.approvalVolume}
              value={formatAmount(
                MOCK_WITHDRAWALS.filter((row) => row.status === "pending").reduce(
                  (sum, row) => sum + row.amount,
                  0
                ),
                "neutral"
              )}
            />
            <SummaryCard
              label={t.gasFees}
              value={formatAmount(
                MOCK_WITHDRAWALS.reduce((sum, row) => sum + row.fee, 0),
                "neutral"
              )}
            />
            <SummaryCard
              label={t.rejected}
              value={MOCK_WITHDRAWALS.filter((row) => row.status === "rejected").length}
            />
          </div>
        }
      >
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t.gasFeeConfiguration}
            </span>
            <span className="text-sm tabular-nums text-zinc-300">
              {t.defaultFee} {formatAmount(4.5, "neutral")}
            </span>
            <span className="text-sm text-zinc-400">{t.networkLabel} TRC20</span>
            <span className="text-sm text-zinc-500">{t.updatedLabel} 2026-03-23</span>
            <AdminButton variant="secondary" className="ml-auto h-10 px-4">
              {translations.common.actions.updatePlaceholder}
            </AdminButton>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {t.placeholderOnly}
          </p>
        </div>
        <WithdrawalsPageClient rows={MOCK_WITHDRAWALS} accountIdFilter={account_id} />
      </DataPanel>
    </div>
  );
}
