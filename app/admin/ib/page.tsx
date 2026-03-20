import { IbRankingTable } from "@/components/tables/ib-ranking-table";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

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

function asNonEmptyString(value: unknown, fallback = "-"): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeIbRankingRow(row: Record<string, unknown>): IbRankingRow | null {
  const ibId = asNonEmptyString(row.ib_id, "");

  if (!ibId) {
    return null;
  }

  return {
    ib_id: ibId,
    ib_name: asNonEmptyString(row.ib_name),
    total_rebate: asNumber(row.total_rebate),
    trader_count: asNumber(row.trader_count),
  };
}

function normalizeRelationshipRow(row: Record<string, unknown>): IbRelationshipRow | null {
  const traderId = asNonEmptyString(row.trader_id, "");

  if (!traderId) {
    return null;
  }

  return {
    trader_id: traderId,
    l1_ib_id: asOptionalString(row.l1_ib_id),
    l2_ib_id: asOptionalString(row.l2_ib_id),
  };
}

async function getIbRanking() {
  const { data, error } = await supabaseServer
    .from("admin_ib_ranking")
    .select("ib_id,ib_name,total_rebate,trader_count")
    .order("total_rebate", { ascending: false })
    .limit(100);

const MOCK_RELATIONSHIPS: IbRelationshipRow[] = [
  { trader_id: "USR-1001", l1_ib_id: "USR-1002", l2_ib_id: "USR-1004" },
  { trader_id: "USR-1003", l1_ib_id: "USR-1002", l2_ib_id: "USR-1004" },
  { trader_id: "USR-1005", l1_ib_id: "USR-1007", l2_ib_id: null },
];

  return ((data as Record<string, unknown>[] | null) ?? [])
    .map((row) => normalizeIbRankingRow(row))
    .filter((row): row is IbRankingRow => row !== null);
}

async function getIbRelationships() {
  const { data, error } = await supabaseServer
    .from("ib_relationships")
    .select("trader_id,l1_ib_id,l2_ib_id")
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Record<string, unknown>[] | null) ?? [])
    .map((row) => normalizeRelationshipRow(row))
    .filter((row): row is IbRelationshipRow => row !== null);
}

async function getIbStats() {
  const [{ data: rebates, error: rebateError }, { data: relationships, error: relationError }] = await Promise.all([
    supabaseServer.from("rebate_records").select("amount"),
    supabaseServer.from("ib_relationships").select("trader_id,l1_ib_id,l2_ib_id"),
  ]);

  if (rebateError) {
    throw new Error(rebateError.message);
  }

  if (relationError) {
    throw new Error(relationError.message);
  }

  const normalizedRelationships = ((relationships as Record<string, unknown>[] | null) ?? [])
    .map((row) => normalizeRelationshipRow(row))
    .filter((row): row is IbRelationshipRow => row !== null);

  const totalRebate = ((rebates as Array<{ amount: unknown }> | null) ?? []).reduce(
    (sum, row) => sum + asNumber(row.amount),
    0,
  );
  const traderCount = new Set(normalizedRelationships.map((row) => row.trader_id).filter(Boolean)).size;
  const l1Count = new Set(normalizedRelationships.map((row) => row.l1_ib_id).filter(Boolean)).size;
  const l2Count = new Set(normalizedRelationships.map((row) => row.l2_ib_id).filter(Boolean)).size;

  return {
    totalRebate,
    traderCount,
    l1Count,
    l2Count,
    relationshipRows: normalizedRelationships.length,
  };
}

export default async function IbNetworkPage() {
  const rankingRows = MOCK_IB_RANKING;
  const relationships = MOCK_RELATIONSHIPS;
  const stats = getIbStats();

  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-lg font-semibold">IB Network</h1>
        <p className="text-sm text-muted-foreground">Mock relationship data for referral hierarchy preview and navigation checks.</p>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">IB Statistics Overview</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Total Rebate</p>
            <p className="mt-1 text-base font-semibold">{formatCurrency(stats.totalRebate)}</p>
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
        <p className="mb-1 text-sm text-muted-foreground">
          Structure is capped at two referral levels: Trader ← L1 ← L2.
        </p>
        <p className="mb-4 text-xs text-muted-foreground">Showing {stats.relationshipRows.toLocaleString()} relationship rows.</p>

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
                <tr key={row.trader_id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs md:text-sm">{row.trader_id}</td>
                  <td className="py-2 pr-4">{row.l1_ib_id ?? <span className="text-muted-foreground">-</span>}</td>
                  <td className="py-2 pr-4">{row.l2_ib_id ?? <span className="text-muted-foreground">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
