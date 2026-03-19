import Link from "next/link";

type UserTableRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
};

type UsersTableProps = {
  users: UserTableRow[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  query: string;
  role: string;
  sortOrder: "asc" | "desc";
};

function buildUsersHref(params: { page: number; query: string; role: string; sort: "asc" | "desc" }) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("sort", params.sort);

  if (params.query) {
    searchParams.set("query", params.query);
  }

  if (params.role) {
    searchParams.set("role", params.role);
  }

  return `/admin/users?${searchParams.toString()}`;
}

export function UsersTable({ users, currentPage, pageSize, totalCount, query, role, sortOrder }: UsersTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <section className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 pr-4 font-medium">User</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Created At</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="py-3 pr-4">
                  <div className="font-medium text-foreground">{user.profiles?.full_name ?? "Unknown User"}</div>
                  <div className="text-xs text-muted-foreground font-mono">{user.user_id}</div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'ib' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{new Date(user.created_at).toLocaleString()}</td>
                <td className="py-3 pr-4 text-right">
                  <Link
                    href={`/admin/users/${user.user_id}`}
                    className="inline-flex items-center rounded-md border bg-background px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-muted transition-colors"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                  No users found matching the current criteria.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground font-medium">
          Page {currentPage} of {totalPages} · <span className="text-foreground">{totalCount}</span> users
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={buildUsersHref({ page: previousPage, query, role, sort: sortOrder })}
            className={`rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
              currentPage <= 1 ? "pointer-events-none opacity-50 bg-muted" : "hover:bg-muted"
            }`}
            aria-disabled={currentPage <= 1}
          >
            Previous
          </Link>
          <Link
            href={buildUsersHref({ page: nextPage, query, role, sort: sortOrder })}
            className={`rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
              currentPage >= totalPages ? "pointer-events-none opacity-50 bg-muted" : "hover:bg-muted"
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
