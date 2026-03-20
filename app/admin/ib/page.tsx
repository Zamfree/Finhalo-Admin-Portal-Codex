import { IbRankingTable } from "@/components/tables/ib-ranking-table";

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

const MOCK_IB_RANKING: IbRankingRow[] = [
  { ib_id: "IB-1101", ib_name: "North Desk", total_rebate: 45200, trader_count: 41 },
  { ib_id: "IB-1164", ib_name: "Alpha Network", total_rebate: 39110, trader_count: 35 },
  { ib_id: "IB-1209", ib_name: "Zenith Group", total_rebate: 33890, trader_count: 29 },
];

const MOCK_RELATIONSHIPS: IbRelationshipRow[] = [
  { trader_id: "USR-1001", l1_ib_id: "USR-1002", l2_ib_id: "USR-1004" },
  { trader_id: "USR-1003", l1_ib_id: "USR-1002", l2_ib_id: "USR-1004" },
  { trader_id: "USR-1005", l1_ib_id: "USR-1007", l2_ib_id: null },
];

function getIbStats() {
  const totalRebate = MOCK_IB_RANKING.reduce((sum, row) => sum + row.total_rebate, 0);
  const traderCount = new Set(MOCK_RELATIONSHIPS.map((row) => row.trader_id)).size;
  const l1Count = new Set(MOCK_RELATIONSHIPS.map((row) => row.l1_ib_id).filter(Boolean)).size;
  const l2Count = new Set(MOCK_RELATIONSHIPS.map((row) => row.l2_ib_id).filter(Boolean)).size;

  return {
    totalRebate,
    traderCount,
    l1Count,
    l2Count,
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
            <p className="mt-1 text-base font-semibold">{stats.totalRebate.toLocaleString()}</p>
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
                <tr key={row.trader_id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono">{row.trader_id}</td>
                  <td className="py-2 pr-4 font-mono">{row.l1_ib_id ?? "-"}</td>
                  <td className="py-2 pr-4 font-mono">{row.l2_ib_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
