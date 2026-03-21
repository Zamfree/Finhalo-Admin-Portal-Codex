import { IbRankingSection } from "@/components/system/data/ib-ranking-section";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

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

const relationshipColumns: DataTableColumn<IbRelationshipRow>[] = [
  {
    key: "trader_id",
    header: "Trader",
    cell: (row) => row.trader_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-300",
  },
  {
    key: "l1_ib_id",
    header: "L1 (Parent IB)",
    cell: (row) => row.l1_ib_id ?? "-",
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-400",
  },
  {
    key: "l2_ib_id",
    header: "L2 (Grand IB)",
    cell: (row) => row.l2_ib_id ?? "-",
    headerClassName:
      "py-2.5 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0 font-mono text-sm text-zinc-400",
  },
];

export default async function IbNetworkPage() {
  const rankingRows = MOCK_IB_RANKING;
  const relationships = MOCK_RELATIONSHIPS;
  const stats = getIbStats();

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Network
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          IB Network
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-400">
          Mock relationship data for referral hierarchy preview and navigation
          checks.
        </p>
      </section>

      <DataPanel title={<h2 className="text-xl font-semibold text-white">IB Statistics Overview</h2>}>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="admin-surface-soft p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Total Rebate
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {stats.totalRebate.toLocaleString()}
            </p>
          </div>
          <div className="admin-surface-soft p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Traders
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {stats.traderCount.toLocaleString()}
            </p>
          </div>
          <div className="admin-surface-soft p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              L1 IBs
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {stats.l1Count.toLocaleString()}
            </p>
          </div>
          <div className="admin-surface-soft p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              L2 IBs
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {stats.l2Count.toLocaleString()}
            </p>
          </div>
        </div>
      </DataPanel>

      <IbRankingSection rows={rankingRows} />

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">IB Relationship Visualization</h2>}
        description={
          <p className="text-sm text-zinc-400">
            Structure is capped at two referral levels: Trader - L1 - L2.
          </p>
        }
      >
        <DataTable
          columns={relationshipColumns}
          rows={relationships}
          getRowKey={(row) => row.trader_id}
          minWidthClassName="min-w-[720px]"
        />
      </DataPanel>
    </div>
  );
}
