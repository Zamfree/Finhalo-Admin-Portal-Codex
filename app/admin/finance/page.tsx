import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

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

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value: unknown): string {
  const parsed = new Date(typeof value === "string" ? value : "");
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
}

function canUseRouteParam(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== "-";
}

function buildUserHref(userId: string | null | undefined): string | null {
  if (!canUseRouteParam(userId)) {
    return null;
  }
  return `/admin/users/${encodeURIComponent(userId.trim())}`;
}

function buildSearchHref(queryValue: string | null | undefined): string | null {
  if (!canUseRouteParam(queryValue)) {
    return null;
  }
  const params = new URLSearchParams();
  params.set("q", queryValue.trim());
  return `/admin/search?${params.toString()}`;
}

function withQueryParams(basePath: string, paramsToAppend: URLSearchParams): string {
  const queryString = paramsToAppend.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
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

  const getParam = (key: string): string => {
    const value = params[key];
    if (Array.isArray(value)) {
      return value[0]?.trim() ?? "";
    }
    return value?.trim() ?? "";
  };

  const userId = getParam("user_id");
  const transactionType = getParam("transaction_type");
  const fromDate = getParam("from_date");
  const toDate = getParam("to_date");

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

  const ledgerRows = ((rows as Record<string, unknown>[] | null) ?? []).map((row, index) => {
    const userIdValue = asOptionalString(row.user_id);
    return {
      id: asNonEmptyString(row.id, `row-${index}`),
      user_id: userIdValue ?? "-",
      transaction_type: asNonEmptyString(row.transaction_type),
      amount: asNumber(row.amount),
      balance_after: asNumber(row.balance_after),
      created_at: asOptionalString(row.created_at),
    };
  });

  const filterContextParams = new URLSearchParams();
  if (transactionType) {
    filterContextParams.set("transaction_type", transactionType);
  }
  if (fromDate) {
    filterContextParams.set("from_date", fromDate);
  }
  if (toDate) {
    filterContextParams.set("to_date", toDate);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Finance Ledger</h1>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded border px-2 py-0.5">Records shown: {ledgerRows.length}</span>
          <Link href="/admin/support/tickets" className="text-primary hover:underline">
            Continue to support tickets
          </Link>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Use user/search links on each row to continue investigation into account activity and support history.
        </p>

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
                const userHref = buildUserHref(row.user_id);
                const searchHref = buildSearchHref(row.user_id);
                const userHrefWithContext = userHref ? withQueryParams(userHref, filterContextParams) : null;
                const searchHrefWithContext = searchHref ? withQueryParams(searchHref, filterContextParams) : null;

                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <div className="font-mono text-xs md:text-sm">
                        {userHrefWithContext ? (
                          <Link href={userHrefWithContext} className="text-primary hover:underline">
                            {row.user_id}
                          </Link>
                        ) : (
                          row.user_id
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {searchHrefWithContext ? (
                          <Link href={searchHrefWithContext} className="text-primary hover:underline">
                            Search related activity
                          </Link>
                        ) : (
                          "Search unavailable"
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4">{row.transaction_type}</td>
                    <td className="py-2 pr-4">{row.amount.toLocaleString()}</td>
                    <td className="py-2 pr-4">{row.balance_after.toLocaleString()}</td>
                    <td className="py-2 pr-4">{formatDateTime(row.created_at)}</td>
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
