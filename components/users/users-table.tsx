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

export function UsersTable({ users, currentPage, totalCount }: UsersTableProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-zinc-500">
              <th className="py-2 pr-4 font-medium">User ID</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Created At</th>
              <th className="py-2 pr-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b border-white/5 text-zinc-200 last:border-0">
                <td className="py-3 pr-4 font-mono text-xs">{user.user_id}</td>
                <td className="py-3 pr-4">{user.email}</td>
                <td className="py-3 pr-4">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-wide text-zinc-300">
                    {user.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-zinc-400">{new Date(user.created_at).toLocaleString()}</td>
                <td className="py-3 pr-4">
                  <Link href={`/admin/users/${user.user_id}`} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">
                    Open detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500">
        Page {currentPage} · {totalCount} users
      </p>
    </section>
  );
}
