import { UsersTable } from "@/components/users/users-table";

type UserRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

const MOCK_USERS: UserRow[] = [
  { user_id: "USR-1001", email: "alex@finhalo.test", role: "trader", created_at: "2026-02-01T10:30:00Z" },
  { user_id: "USR-1002", email: "mia@finhalo.test", role: "ib", created_at: "2026-02-03T08:14:00Z" },
  { user_id: "USR-1003", email: "sam@finhalo.test", role: "trader", created_at: "2026-02-06T13:55:00Z" },
  { user_id: "USR-1004", email: "olivia@finhalo.test", role: "admin", created_at: "2026-02-10T16:22:00Z" },
  { user_id: "USR-1005", email: "james@finhalo.test", role: "trader", created_at: "2026-02-12T11:45:00Z" },
  { user_id: "USR-1006", email: "sophia@finhalo.test", role: "trader", created_at: "2026-02-15T09:41:00Z" },
  { user_id: "USR-1007", email: "logan@finhalo.test", role: "ib", created_at: "2026-02-17T15:20:00Z" },
  { user_id: "USR-1008", email: "ava@finhalo.test", role: "trader", created_at: "2026-02-20T12:08:00Z" },
  { user_id: "USR-1009", email: "lucas@finhalo.test", role: "trader", created_at: "2026-02-24T07:10:00Z" },
  { user_id: "USR-1010", email: "noah@finhalo.test", role: "trader", created_at: "2026-02-27T18:30:00Z" },
];

const PAGE_SIZE = 10;

export default async function UsersPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Users</h1>
        <p className="mb-4 text-sm text-muted-foreground">Preview-mode user list with static data.</p>

        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <label htmlFor="query" className="mb-1 block text-sm font-medium">
              Search users
            </label>
            <input
              id="query"
              name="query"
              placeholder="Search by email or user ID"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="sort" className="mb-1 block text-sm font-medium">
              Sort by created_at
            </label>
            <select id="sort" name="sort" className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          <button type="button" className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            Apply (Preview)
          </button>
        </form>
      </section>

      <UsersTable
        users={MOCK_USERS}
        currentPage={1}
        pageSize={PAGE_SIZE}
        totalCount={MOCK_USERS.length}
        query=""
        sortOrder="desc"
      />
    </div>
  );
}
