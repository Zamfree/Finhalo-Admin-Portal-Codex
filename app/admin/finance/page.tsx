type FinanceLedgerRow = {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  created_at: string;
};

const MOCK_LEDGER_ROWS: FinanceLedgerRow[] = [
  { id: "LED-9001", user_id: "USR-1001", transaction_type: "commission", amount: 125.4, balance_after: 1025.4, created_at: "2026-03-18T11:10:00Z" },
  { id: "LED-9002", user_id: "USR-1002", transaction_type: "rebate", amount: 42.75, balance_after: 784.2, created_at: "2026-03-18T12:20:00Z" },
  { id: "LED-9003", user_id: "USR-1001", transaction_type: "withdrawal", amount: -50, balance_after: 975.4, created_at: "2026-03-19T08:01:00Z" },
  { id: "LED-9004", user_id: "USR-1003", transaction_type: "admin_fee", amount: -8.25, balance_after: 611.95, created_at: "2026-03-19T09:41:00Z" },
];

const TRANSACTION_TYPES = ["commission", "rebate", "withdrawal", "admin_fee"];

export default async function FinanceLedgerPage() {
  const ledgerRows = MOCK_LEDGER_ROWS;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Finance Ledger</h1>
        <p className="mb-4 text-sm text-muted-foreground">Preview-mode ledger with static filter controls.</p>

        <form className="grid gap-3 md:grid-cols-5 md:items-end">
          <div>
            <label htmlFor="user_id" className="mb-1 block text-sm font-medium">
              Filter by user
            </label>
            <input
              id="user_id"
              name="user_id"
              placeholder="user_id"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="transaction_type" className="mb-1 block text-sm font-medium">
              Transaction type
            </label>
            <select id="transaction_type" name="transaction_type" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All types</option>
              {TRANSACTION_TYPES.map((type) => (
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
            <input id="from_date" type="date" name="from_date" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>

          <div>
            <label htmlFor="to_date" className="mb-1 block text-sm font-medium">
              To date
            </label>
            <input id="to_date" type="date" name="to_date" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>

          <button type="button" className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            Apply filters (Preview)
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
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
