import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

import { SummaryCard, formatAmount } from "../_shared";
import { LedgerPageClient, type LedgerRow } from "./ledger-page-client";

const MOCK_LEDGER_ROWS: LedgerRow[] = [
  {
    ledger_ref: "LED-9101",
    entry_type: "rebate_payout",
    beneficiary: "alice@example.com",
    account_id: "ACC-2001",
    trader_user_id: "USR-1001",
    l1_ib_id: "IB-2101",
    l2_ib_id: null,
    relationship_snapshot_id: "REL-SNP-2001",
    related_rebate_record: "REB-5001",
    amount: 96.2,
    direction: "credit",
    status: "posted",
    created_at: "2026-03-21T10:30:00Z",
  },
  {
    ledger_ref: "LED-9102",
    entry_type: "withdrawal",
    beneficiary: "bob@example.com",
    account_id: "ACC-2002",
    trader_user_id: "USR-1002",
    l1_ib_id: "IB-2102",
    l2_ib_id: "IB-3101",
    relationship_snapshot_id: "REL-SNP-2002",
    related_rebate_record: null,
    amount: 120,
    direction: "debit",
    status: "pending",
    created_at: "2026-03-22T08:15:00Z",
  },
  {
    ledger_ref: "LED-9103",
    entry_type: "adjustment",
    beneficiary: "charlie@example.com",
    account_id: "ACC-2003",
    trader_user_id: "USR-1003",
    l1_ib_id: null,
    l2_ib_id: "IB-3102",
    relationship_snapshot_id: "REL-SNP-2003",
    related_rebate_record: "REB-5003",
    amount: 28,
    direction: "debit",
    status: "reversed",
    created_at: "2026-03-20T15:00:00Z",
  },
];

type LedgerPageProps = {
  searchParams: Promise<{
    ledger_ref?: string;
    rebate_record_id?: string;
    account_id?: string;
  }>;
};

export default async function LedgerPage({ searchParams }: LedgerPageProps) {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const { ledger_ref, rebate_record_id, account_id } = await searchParams;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Ledger
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.ledger}<span className="ml-1.5 inline-block text-teal-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.ledgerDescription}</p>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.ledgerPanelTitle}</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">{t.ledgerPanelDescription}</p>
        }
        summary={
          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label={t.totalLedgerAmount}
              value={formatAmount(
                MOCK_LEDGER_ROWS.reduce(
                  (sum, row) => sum + (row.direction === "credit" ? row.amount : -row.amount),
                  0
                ),
                "neutral"
              )}
              emphasis="strong"
            />
            <SummaryCard
              label={t.postedEntries}
              value={MOCK_LEDGER_ROWS.filter((row) => row.status === "posted").length}
            />
            <SummaryCard
              label={t.pendingEntries}
              value={MOCK_LEDGER_ROWS.filter((row) => row.status === "pending").length}
            />
            <SummaryCard
              label={t.reversedEntries}
              value={MOCK_LEDGER_ROWS.filter((row) => row.status === "reversed").length}
            />
          </div>
        }
        footer={t.ledgerFooter}
      >
        <LedgerPageClient
          rows={MOCK_LEDGER_ROWS}
          ledgerRefFilter={ledger_ref}
          rebateRecordIdFilter={rebate_record_id}
          accountIdFilter={account_id}
        />
      </DataPanel>
    </div>
  );
}
