import Link from "next/link";

type AccountRow = {
  account_id: string;
  account_number: string;
  user_id: string;
  status: "active" | "inactive";
  broker: string;
};

const MOCK_ACCOUNTS: AccountRow[] = [
  { account_id: "ACC-2001", account_number: "8800123", user_id: "USR-1001", status: "active", broker: "BrokerOne" },
  { account_id: "ACC-2002", account_number: "8800456", user_id: "USR-1002", status: "active", broker: "Prime Markets" },
  { account_id: "ACC-2003", account_number: "8800789", user_id: "USR-1003", status: "inactive", broker: "Vertex Trade" },
];

export default async function AccountsPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Trading Accounts</h1>
        <p className="mb-4 text-sm text-muted-foreground">Preview-mode account list for UI shell validation.</p>

        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <label htmlFor="account_query" className="mb-1 block text-sm font-medium">
              Search accounts
            </label>
            <input
              id="account_query"
              name="account_query"
              placeholder="Account number or user ID"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button type="button" className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            Apply (Preview)
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Account ID</th>
                <th className="py-2 pr-4 font-medium">Account Number</th>
                <th className="py-2 pr-4 font-medium">User ID</th>
                <th className="py-2 pr-4 font-medium">Broker</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACCOUNTS.map((account) => (
                <tr key={account.account_id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{account.account_id}</td>
                  <td className="py-2 pr-4">{account.account_number}</td>
                  <td className="py-2 pr-4">{account.user_id}</td>
                  <td className="py-2 pr-4">{account.broker}</td>
                  <td className="py-2 pr-4">{account.status}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/admin/accounts/${account.account_id}`} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                      Open detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
