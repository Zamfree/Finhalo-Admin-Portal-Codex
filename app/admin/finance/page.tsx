import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
  profiles: {
    full_name: string | null;
  } | null;
};

type FinancePageProps = {
  searchParams: Promise<SearchParams>;
};

async function getTransactionTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_ledger")
    .select("transaction_type")
    .order("transaction_type", { ascending: true });

  if (error) {
    console.error("Error fetching transaction types:", error);
    return [];
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

function getTransactionContext(type: string) {
  const t = (type ?? "").toLowerCase().trim();
  switch (t) {
    case 'rebate':
      return {
        label: "Rebate",
        hint: "From commission distribution",
        link: "/admin/commissions"
      };
    case 'admin_fee':
      return {
        label: "Admin Fee",
        hint: "Platform fee",
        link: null
      };
    case 'withdrawal':
      return {
        label: "Withdrawal",
        hint: "User withdrawal",
        link: "/admin/finance/withdrawals"
      };
    case 'adjustment':
      return {
        label: "Adjustment",
        hint: "Manual adjustment",
        link: null
      };
    default:
      return {
        label: type || "Unknown",
        hint: null,
        link: null
      };
  }
}

export default async function FinanceLedgerPage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const userId = params.user_id?.trim() ?? "";
  const transactionType = params.transaction_type?.trim() ?? "";
  const fromDate = params.from_date?.trim() ?? "";
  const toDate = params.to_date?.trim() ?? "";

  let query = supabase
    .from("finance_ledger")
    .select(`
      id,
      user_id,
      transaction_type,
      amount,
      balance_after,
      created_at,
      profiles (
        full_name
      )
    `)
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
    console.error("Error fetching ledger rows:", error);
  }

  const ledgerRows = (rows as unknown as FinanceLedgerRow[] | null) ?? [];

  const hasActiveFilters = Boolean(userId || transactionType || fromDate || toDate);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Finance Ledger</h1>
          {hasActiveFilters && (
            <Link
              href="/admin/finance"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Reset all filters
            </Link>
          )}
        </div>

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
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
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
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
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
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
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
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Apply filters
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Transaction Type</th>
                <th className="py-2 pr-4 font-medium text-right">Amount</th>
                <th className="py-2 pr-4 font-medium text-right">Balance After</th>
                <th className="py-2 pr-4 font-medium text-right">Created At</th>
              </tr>
            </thead>
            <tbody>
              {ledgerRows.map((row) => {
                const context = getTransactionContext(row.transaction_type);
                return (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/users/${row.user_id}`}
                        className="group block"
                      >
                        <div className="font-medium group-hover:text-primary group-hover:underline">
                          {row.profiles?.full_name ?? "Unknown User"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {row.user_id}
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/finance?transaction_type=${row.transaction_type}&from_date=${fromDate}&to_date=${toDate}`}
                            title={`Filter by ${row.transaction_type}`}
                            className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            {context.label}
                          </Link>
                          {context.link && (
                            <Link
                              href={context.link}
                              className="text-[10px] text-muted-foreground hover:text-primary underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-primary transition-colors"
                            >
                              Investigate
                            </Link>
                          )}
                        </div>
                        {context.hint && (
                          <div className="text-[10px] text-muted-foreground italic leading-none">
                            {context.hint}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 pr-4 text-right font-mono font-medium ${row.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {row.amount > 0 ? "+" : row.amount < 0 ? "" : ""}{Number(row.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-muted-foreground">
                      {Number(row.balance_after ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 pr-4 text-right text-muted-foreground">
                      <div className="whitespace-nowrap">{row.created_at ? new Date(row.created_at).toLocaleDateString() : "N/A"}</div>
                      <div className="text-[10px] italic">{row.created_at ? new Date(row.created_at).toLocaleTimeString() : ""}</div>
                    </td>
                  </tr>
                );
              })}
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                    No finance ledger records found matching the current filters.
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
