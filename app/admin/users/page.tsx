const MOCK_USERS = [
  {
    user_id: "USR-1001",
    name: "Alex Tan",
    email: "alex.tan@example.com",
    role: "Client",
    status: "Active",
    joined_at: "2026-03-18",
  },
  {
    user_id: "USR-1002",
    name: "Sarah Lim",
    email: "sarah.lim@example.com",
    role: "IB",
    status: "Pending",
    joined_at: "2026-03-17",
  },
  {
    user_id: "USR-1003",
    name: "Jason Lee",
    email: "jason.lee@example.com",
    role: "Client",
    status: "Restricted",
    joined_at: "2026-03-16",
  },
];

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Review user accounts, roles, and statuses.
          </p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm">
          Add User
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-4 flex gap-3">
          <input
            className="w-64 rounded-lg border px-3 py-2 text-sm"
            placeholder="Search name or email..."
          />
          <select className="rounded-lg border px-3 py-2 text-sm">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Restricted</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-3">User ID</th>
              <th className="py-3">Name</th>
              <th className="py-3">Email</th>
              <th className="py-3">Role</th>
              <th className="py-3">Status</th>
              <th className="py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map((user) => (
              <tr key={user.user_id} className="border-b">
                <td className="py-3">{user.user_id}</td>
                <td className="py-3">{user.name}</td>
                <td className="py-3">{user.email}</td>
                <td className="py-3">{user.role}</td>
                <td className="py-3">{user.status}</td>
                <td className="py-3">{user.joined_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
