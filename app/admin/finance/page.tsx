type SearchParams = {
  user_id?: string;
  transaction_type?: string;
  from_date?: string;
  to_date?: string;
};

type FinanceLedgerRow = {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  created_at: string;
};

type FinancePageProps = {
  searchParams: Promise<SearchParams>;
};

const MOCK_LEDGER_ROWS: FinanceLedgerRow[] = [
  { id: "LED-9001", user_id: "USR-1001", transaction_type: "commission", amount: 125.4, balance_after: 1025.4, created_at: "2026-03-18T11:10:00Z" },
  { id: "LED-9002", user_id: "USR-1002", transaction_type: "rebate", amount: 42.75, balance_after: 784.2, created_at: "2026-03-18T12:20:00Z" },
  { id: "LED-9003", user_id: "USR-1001", transaction_type: "withdrawal", amount: -50, balance_after: 975.4, created_at: "2026-03-19T08:01:00Z" },
  { id: "LED-9004", user_id: "USR-1003", transaction_type: "admin_fee", amount: -8.25, balance_after: 611.95, created_at: "2026-03-19T09:41:00Z" },
];

function getTransactionTypes() {
  const uniqueTypes = new Set<string>();

  for (const row of MOCK_LEDGER_ROWS) {
    const value = String(row.transaction_type ?? "").trim();
    if (value) {
      uniqueTypes.add(value);
    }
  }

  return Array.from(uniqueTypes).sort((a, b) => a.localeCompare(b));
}

export default async function FinanceLedgerPage({ searchParams }: FinancePageProps) {
  const params = await searchParams;

  const userId = params.user_id?.trim() ?? "";
  const transactionType = params.transaction_type?.trim() ?? "";
  const fromDate = params.from_date?.trim() ?? "";
  const toDate = params.to_date?.trim() ?? "";

  const ledgerRows = MOCK_LEDGER_ROWS.filter((row) => {
    if (userId && row.user_id !== userId) return false;
    if (transactionType && row.transaction_type !== transactionType) return false;

    const createdAt = new Date(row.created_at).getTime();

    if (fromDate) {
      const fromTime = new Date(`${fromDate}T00:00:00`).getTime();
      if (Number.isFinite(fromTime) && createdAt < fromTime) return false;
    }

    if (toDate) {
      const toTime = new Date(`${toDate}T23:59:59`).getTime();
      if (Number.isFinite(toTime) && createdAt > toTime) return false;
    }

    return true;
  });

  const transactionTypes = getTransactionTypes();

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Finance Ledger</h1>
        <p className="mb-4 text-sm text-muted-foreground">Static ledger preview data with working filter controls.</p>

        <form className="grid gap-3 md:grid-cols-5 md:items-end">
          <div>
            <label htmlFor="user_id" className="mb-1 block text-sm font-medium">
              Filter by user
            </label>
            <input
              id="user_id"
              name="user_id"
              defaultValue={userId}
              placeholder="user_id"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="transaction_type" className="mb-1 block text-sm font-medium">
              Transaction type
            </label>
            <select
              id="transaction_type"
              name="transaction_type"
              defaultValue={transactionType}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All types</option>
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="from_date" className="mb-1 block text-sm font-medium">
              From date
            </label>
            <input
              id="from_date"
              type="date"
              name="from_date"
              defaultValue={fromDate}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="to_date" className="mb-1 block text-sm font-medium">
              To date
            </label>
            <input
              id="to_date"
              type="date"
              name="to_date"
              defaultValue={toDate}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            Apply filters
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">User ID</th>
                <th className="py-2 pr-4 font-medium">Transaction Type</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Balance After</th>
                <th className="py-2 pr-4 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody>
              {ledgerRows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{row.user_id}</td>
                  <td className="py-2 pr-4">{row.transaction_type}</td>
                  <td className="py-2 pr-4">{Number(row.amount).toLocaleString()}</td>
                  <td className="py-2 pr-4">{Number(row.balance_after).toLocaleString()}</td>
                  <td className="py-2 pr-4">{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No finance ledger records found.
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
