import { UsersTable } from "@/components/users/users-table";
import { supabaseServer } from "@/lib/supabase/server";

type SearchParams = {
  page?: string;
  query?: string;
  sort?: string;
};

type UserRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

type UsersPageProps = {
  searchParams: Promise<SearchParams>;
};

const PAGE_SIZE = 10;

function normalizeSortOrder(sort: string | undefined): "asc" | "desc" {
  return sort === "asc" ? "asc" : "desc";
}

function normalizePage(page: string | undefined): number {
  const parsed = Number(page);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const query = params.query?.trim() ?? "";
  const sortOrder = normalizeSortOrder(params.sort);
  const page = normalizePage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let usersQuery = supabaseServer
    .from("users")
    .select("user_id,email,role,created_at", { count: "exact" })
    .order("created_at", { ascending: sortOrder === "asc" })
    .range(from, to);

  if (query) {
    usersQuery = usersQuery.or(`email.ilike.%${query}%,user_id.ilike.%${query}%`);
  }

  const { data, error, count } = await usersQuery;

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <label htmlFor="query" className="mb-1 block text-sm font-medium">
              Search users
            </label>
            <input
              id="query"
              name="query"
              defaultValue={query}
              placeholder="Search by email or user ID"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="sort" className="mb-1 block text-sm font-medium">
              Sort by created_at
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sortOrder}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          <input type="hidden" name="page" value="1" />

          <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            Apply
          </button>
        </form>
      </section>

      <UsersTable
        users={(data as UserRow[] | null) ?? []}
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        query={query}
        sortOrder={sortOrder}
      />
    </div>
  );
}
