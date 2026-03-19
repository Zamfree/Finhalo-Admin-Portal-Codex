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

async function getIbRelationships() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ib_relationships")
    .select("trader_id,l1_ib_id,l2_ib_id")
    .limit(200);

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

  if (rebateError) {
    console.error("Error fetching rebate records for stats:", rebateError);
  }

  if (relationError) {
    console.error("Error fetching relationships for stats:", relationError);
  }

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

export default async function IbNetworkPage() {
  const [rankingRows, stats, relationships] = await Promise.all([
    getIbRanking(),
    getIbStats(),
    getIbRelationships(),
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
        <h2 className="mb-2 text-base font-semibold">IB Relationship Visualization</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Structure is capped at two referral levels: Trader ← L1 ← L2.
        </p>

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
                    No IB relationships found.
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
