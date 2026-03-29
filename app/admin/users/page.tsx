import { UsersPageClient } from "./users-page-client";
import { SummaryCard } from "./_shared";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import {
  getAdminOwnedAccountsByUser,
  getAdminUserOperationalHistoryMap,
  getAdminUserActivitySummaryMap,
  getAdminUsers,
} from "@/services/admin/users.service";
import { getAdminAccounts } from "@/services/admin/accounts.service";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

export default async function UsersPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.users;
  const rows = await getAdminUsers();
  const accounts = await getAdminAccounts();
  const [ownedAccountsByUser, activityByUser, operationalHistoryByUser] = await Promise.all([
    getAdminOwnedAccountsByUser(rows.map((row) => row.user_id)),
    getAdminUserActivitySummaryMap(rows.map((row) => row.user_id)),
    getAdminUserOperationalHistoryMap(rows.map((row) => row.user_id)),
  ]);
  const totalUsers = rows.length;
  const activeUsers = rows.filter((row) => row.status === "active").length;
  const accountCountByUser = accounts.reduce<Record<string, number>>((accumulator, account) => {
    accumulator[account.user_id] = (accumulator[account.user_id] ?? 0) + 1;
    return accumulator;
  }, {});
  const usersWithMultipleAccounts = rows.filter((row) => (accountCountByUser[row.user_id] ?? 0) > 1).length;
  const brokersCovered = new Set(accounts.map((row) => row.broker)).size;

  return (
    <div className="space-y-5 pb-8 xl:space-y-6">
      <PageHeader
        eyebrow="Admin / Users"
        title={t.title}
        description={t.description}
        accentClassName="bg-sky-400"
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t.totalUsers} value={totalUsers} emphasis="strong" />
        <SummaryCard label={t.activeUsers} value={activeUsers} emphasis="strong" />
        <SummaryCard label={t.usersWithMultipleAccounts} value={usersWithMultipleAccounts} />
        <SummaryCard label={t.brokersCovered} value={brokersCovered} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.directoryTitle}</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">{t.directoryDescription}</p>
        }
      >
        <UsersPageClient
          rows={rows}
          ownedAccountsByUser={ownedAccountsByUser}
          activityByUser={activityByUser}
          operationalHistoryByUser={operationalHistoryByUser}
        />
      </DataPanel>
    </div>
  );
}
