import Link from "next/link";

type UserTableRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

type UsersTableProps = {
  users: UserTableRow[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  query: string;
  sortOrder: "asc" | "desc";
};

function buildUsersHref(params: { page: number; query: string; sort: "asc" | "desc" }) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("sort", params.sort);

  if (params.query) {
    searchParams.set("query", params.query);
  }

  return `/admin/users?${searchParams.toString()}`;
}

export function UsersTable({ users, currentPage, pageSize, totalCount, query, sortOrder }: UsersTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <section className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 pr-4 font-medium">User ID</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Created At</th>
              <th className="py-2 pr-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b last:border-0">
                <td className="py-2 pr-4">{user.user_id}</td>
                <td className="py-2 pr-4">{user.email}</td>
                <td className="py-2 pr-4">{user.role}</td>
                <td className="py-2 pr-4">{new Date(user.created_at).toLocaleString()}</td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/admin/users/${user.user_id}`}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  >
                    Open detail
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} · {totalCount} users
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={buildUsersHref({ page: previousPage, query, sort: sortOrder })}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              currentPage <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"
            }`}
            aria-disabled={currentPage <= 1}
          >
            Previous
          </Link>
          <Link
            href={buildUsersHref({ page: nextPage, query, sort: sortOrder })}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              currentPage >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"
            }`}
            aria-disabled={currentPage >= totalPages}
          >
            Next
          </Link>
        </div>
      </div>
    </section>
  );
}
