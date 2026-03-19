import Link from "next/link";
import { UsersTable } from "@/components/users/users-table";
import { createClient } from "@/lib/supabase/server";

type SearchParams = {
  page?: string;
  query?: string;
  sort?: string;
  role?: string;
};

type UserRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
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
  const supabase = await createClient();

  const query = params.query?.trim() ?? "";
  const role = params.role?.trim() ?? "";
  const sortOrder = normalizeSortOrder(params.sort);
  const page = normalizePage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let usersQuery = supabase
    .from("users")
    .select(`
      user_id,
      email,
      role,
      created_at,
      profiles (
        full_name
      )
    `, { count: "exact" })
    .order("created_at", { ascending: sortOrder === "asc" })
    .range(from, to);

  if (query) {
    usersQuery = usersQuery.or(`email.ilike.%${query}%,user_id.ilike.%${query}%`);
  }

  if (role) {
    usersQuery = usersQuery.eq("role", role);
  }

  const { data, error, count } = await usersQuery;

  if (error) {
    console.error("Error fetching users:", error);
  }

  const hasActiveFilters = Boolean(query || role);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Admin Users</h1>
          {hasActiveFilters && (
            <Link
              href="/admin/users"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Clear all filters
            </Link>
          )}
        </div>

        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <label htmlFor="query" className="mb-1 block text-sm font-medium">
              Search Users
            </label>
            <input
              id="query"
              name="query"
              defaultValue={query}
              placeholder="Email or user ID"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium">
              Filter by Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue={role}
              className="rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="ib">IB</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="mb-1 block text-sm font-medium">
              Sort Order
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sortOrder}
              className="rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          <input type="hidden" name="page" value="1" />

          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Apply
          </button>
        </form>
      </section>

      <UsersTable
        users={(data as unknown as UserRow[] | null) ?? []}
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        query={query}
        role={role}
        sortOrder={sortOrder}
      />
    </div>
  );
}
