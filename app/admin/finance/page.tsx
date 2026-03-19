import Link from "next/link";

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

function canUseRouteParam(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function buildFinanceFilterHref(filters: SearchParams): string | null {
  const params = new URLSearchParams();

  if (canUseRouteParam(filters.user_id)) {
    params.set("user_id", filters.user_id.trim());
  }

  if (canUseRouteParam(filters.transaction_type)) {
    params.set("transaction_type", filters.transaction_type.trim());
  }

  if (canUseRouteParam(filters.from_date)) {
    params.set("from_date", filters.from_date.trim());
  }

  if (canUseRouteParam(filters.to_date)) {
    params.set("to_date", filters.to_date.trim());
  }

  const serialized = params.toString();
  return serialized ? `/admin/finance?${serialized}` : null;
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

  const ledgerRows = (rows as FinanceLedgerRow[] | null) ?? [];

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
              {ledgerRows.map((row) => {
                const userHref = canUseRouteParam(row.user_id) ? `/admin/users/${row.user_id}` : null;
                const transactionTypeHref = buildFinanceFilterHref({ transaction_type: row.transaction_type });

                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {userHref ? (
                        <Link href={userHref} className="text-primary hover:underline">
                          {row.user_id}
                        </Link>
                      ) : (
                        row.user_id
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {transactionTypeHref ? (
                        <Link href={transactionTypeHref} className="text-primary hover:underline">
                          {row.transaction_type}
                        </Link>
                      ) : (
                        row.transaction_type
                      )}
                    </td>
                    <td className="py-2 pr-4">{Number(row.amount).toLocaleString()}</td>
                    <td className="py-2 pr-4">{Number(row.balance_after).toLocaleString()}</td>
                    <td className="py-2 pr-4">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
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
