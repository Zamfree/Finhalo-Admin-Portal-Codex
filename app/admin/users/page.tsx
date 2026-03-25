import { UsersPageClient } from "./users-page-client";
import { MOCK_TRADING_ACCOUNTS } from "../accounts/_mock-data";
import { getAccountsForUser } from "./_mock-data";
import { SummaryCard } from "./_shared";
import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminUsers } from "@/services/admin/users.service";

export default async function UsersPage() {
  const rows = await getAdminUsers();
  const totalUsers = rows.length;
  const activeUsers = rows.filter((row) => row.status === "active").length;
  const usersWithMultipleAccounts = rows.filter(
    (row) => getAccountsForUser(row.user_id).length > 1
  ).length;
  const brokersCovered = new Set(MOCK_TRADING_ACCOUNTS.map((row) => row.broker)).size;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Users
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Users<span className="ml-1.5 inline-block text-blue-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Identity and owner entry point for platform users, with clear access into the trading
          accounts that anchor downstream commission and finance activity.
        </p>
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Users" value={totalUsers} emphasis="strong" />
        <SummaryCard label="Active Users" value={activeUsers} emphasis="strong" />
        <SummaryCard label="Users With Multiple Accounts" value={usersWithMultipleAccounts} />
        <SummaryCard label="Brokers Covered" value={brokersCovered} />
      </div>

      <DataPanel
        title="Users Directory"
        description="Browse platform users, review linked trading accounts, and inspect account activity from a single operational workspace."
      >
        <UsersPageClient rows={rows} />
      </DataPanel>
    </div>
  );
}
