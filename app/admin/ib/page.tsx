import Link from "next/link";
import { IbRankingTable } from "@/components/tables/ib-ranking-table";
import { createClient } from "@/lib/supabase/server";

type IbRankingRow = {
  ib_id: string;
  ib_name: string;
  total_rebate: number;
  trader_count: number;
};

type IbRelationshipRow = {
  trader_id: string;
  l1_ib_id: string | null;
  l2_ib_id: string | null;
};

type SearchParams = {
  user_id?: string;
};

type IbNetworkPageProps = {
  searchParams: Promise<SearchParams>;
};

async function getIbRanking() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_ib_ranking")
    .select("ib_id,ib_name,total_rebate,trader_count")
    .order("total_rebate", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching IB ranking:", error);
    return [];
  }

  return (data as IbRankingRow[] | null) ?? [];
}

async function getIbRelationships(filters: SearchParams) {
  const supabase = await createClient();
  let query = supabase.from("ib_relationships").select("trader_id,l1_ib_id,l2_ib_id");

  if (filters.user_id) {
    query = query.or(`trader_id.eq.${filters.user_id},l1_ib_id.eq.${filters.user_id},l2_ib_id.eq.${filters.user_id}`);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    console.error("Error fetching IB relationships:", error);
    return [];
  }

  return (data as IbRelationshipRow[] | null) ?? [];
}

async function getIbStats() {
  const supabase = await createClient();
  const [{ data: rebates, error: rebateError }, { data: relationships, error: relationError }] = await Promise.all([
    supabase.from("rebate_records").select("amount"),
    supabase.from("ib_relationships").select("trader_id,l1_ib_id,l2_ib_id"),
  ]);

  if (rebateError) console.error("Error fetching rebate records for stats:", rebateError);
  if (relationError) console.error("Error fetching relationships for stats:", relationError);

  const totalRebate = (rebates ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const traderCount = new Set((relationships ?? []).map((row) => row.trader_id).filter(Boolean)).size;
  const l1Count = new Set((relationships ?? []).map((row) => row.l1_ib_id).filter(Boolean)).size;
  const l2Count = new Set((relationships ?? []).map((row) => row.l2_ib_id).filter(Boolean)).size;

  return {
    totalRebate,
    traderCount,
    l1Count,
    l2Count,
  };
}

export default async function IbNetworkPage({ searchParams }: IbNetworkPageProps) {
  const params = await searchParams;
  const userId = params.user_id?.trim() ?? "";

  const [rankingRows, stats, relationships] = await Promise.all([
    getIbRanking(),
    getIbStats(),
    getIbRelationships(params),
  ]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">IB Statistics Overview</h1>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Total Rebate</p>
            <p className="mt-1 text-base font-semibold">${(stats.totalRebate ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Traders</p>
            <p className="mt-1 text-base font-semibold">{stats.traderCount.toLocaleString()}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">L1 IBs</p>
            <p className="mt-1 text-base font-semibold">{stats.l1Count.toLocaleString()}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">L2 IBs</p>
            <p className="mt-1 text-base font-semibold">{stats.l2Count.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <IbRankingTable rows={rankingRows} />

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">IB Relationship Visualization</h2>
            <p className="text-sm text-muted-foreground">
              Structure is capped at two referral levels: Trader ← L1 ← L2.
            </p>
          </div>
          {userId && (
            <Link
              href="/admin/ib"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Reset relationship filters
            </Link>
          )}
        </div>

        <form className="mb-6 flex max-w-sm items-end gap-3">
          <div className="flex-1">
            <label htmlFor="user_id" className="mb-1 block text-sm font-medium">
              Filter by User ID
            </label>
            <input
              id="user_id"
              name="user_id"
              defaultValue={userId}
              placeholder="user_id..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Filter
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Trader</th>
                <th className="py-2 pr-4 font-medium">L1 (Parent IB)</th>
                <th className="py-2 pr-4 font-medium">L2 (Grand IB)</th>
              </tr>
            </thead>
            <tbody>
              {relationships.map((row) => (
                <tr key={row.trader_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/users/${row.trader_id}`} className="font-mono text-primary hover:underline">
                      {row.trader_id}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    {row.l1_ib_id ? (
                      <Link href={`/admin/users/${row.l1_ib_id}`} className="font-mono text-primary hover:underline">
                        {row.l1_ib_id}
                      </Link>
                    ) : "-"}
                  </td>
                  <td className="py-3 pr-4">
                    {row.l2_ib_id ? (
                      <Link href={`/admin/users/${row.l2_ib_id}`} className="font-mono text-primary hover:underline">
                        {row.l2_ib_id}
                      </Link>
                    ) : "-"}
                  </td>
                </tr>
              ))}
              {relationships.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-muted-foreground italic">
                    No IB relationships found matching the criteria.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
