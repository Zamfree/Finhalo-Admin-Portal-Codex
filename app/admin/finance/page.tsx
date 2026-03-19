import { supabaseServer } from "@/lib/supabase/server";

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

function asNonEmptyString(value: unknown, fallback = "-"): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
}

function formatTransactionType(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSignedAmount(value: number): string {
  const abs = Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (value > 0) {
    return `+${abs}`;
  }

  if (value < 0) {
    return `-${abs}`;
  }

  return abs;
}

function normalizeLedgerRow(row: Record<string, unknown>): FinanceLedgerRow | null {
  const id = asNonEmptyString(row.id, "");

  if (!id) {
    return null;
  }

  return {
    id,
    user_id: asNonEmptyString(row.user_id),
    transaction_type: asNonEmptyString(row.transaction_type),
    amount: asNumber(row.amount),
    balance_after: asNumber(row.balance_after),
    created_at: asNonEmptyString(row.created_at, ""),
  };
}

async function getTransactionTypes() {
  const { data, error } = await supabaseServer
    .from("finance_ledger")
    .select("transaction_type")
    .order("transaction_type", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const uniqueTypes = new Set<string>();

  for (const row of data ?? []) {
    const value = String(row.transaction_type ?? "").trim();
    if (value) {
      uniqueTypes.add(value);
    }
  }

  return Array.from(uniqueTypes);
}

export default async function FinanceLedgerPage({ searchParams }: FinancePageProps) {
  const params = await searchParams;

  const userId = params.user_id?.trim() ?? "";
  const transactionType = params.transaction_type?.trim() ?? "";
  const fromDate = params.from_date?.trim() ?? "";
  const toDate = params.to_date?.trim() ?? "";

  let query = supabaseServer
    .from("finance_ledger")
    .select("id,user_id,transaction_type,amount,balance_after,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (transactionType) {
    query = query.eq("transaction_type", transactionType);
  }

  if (fromDate) {
    query = query.gte("created_at", `${fromDate}T00:00:00`);
  }

  if (toDate) {
    query = query.lte("created_at", `${toDate}T23:59:59`);
  }

  const [{ data: rows, error }, transactionTypes] = await Promise.all([query, getTransactionTypes()]);

  if (error) {
    throw new Error(error.message);
  }

  const ledgerRows = ((rows as Record<string, unknown>[] | null) ?? [])
    .map((row) => normalizeLedgerRow(row))
    .filter((row): row is FinanceLedgerRow => row !== null);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Finance Ledger</h1>

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

        <p className="mt-3 text-xs text-muted-foreground">
          {userId ? `User: ${userId} · ` : ""}
          {transactionType ? `Type: ${transactionType} · ` : ""}
          {fromDate || toDate ? `Range: ${fromDate || "-"} → ${toDate || "-"}` : "All dates"}
        </p>
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
                  <td className="py-2 pr-4">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{formatTransactionType(row.transaction_type)}</span>
                  </td>
                  <td className="py-2 pr-4">{formatSignedAmount(row.amount)}</td>
                  <td className="py-2 pr-4">{row.balance_after.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-2 pr-4">
                    <div>{formatDateTime(row.created_at)}</div>
                    <div className="text-xs text-muted-foreground">ID: {row.id}</div>
                  </td>
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
