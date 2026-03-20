import { DataPanel } from "@/components/system/data/data-panel";
import { IbRankingTable } from "@/components/system/data/ib-ranking-table";

type IbRankingRow = {
  ib_id: string;
  ib_name: string;
  total_rebate: number;
  trader_count: number;
};

type IbRankingSectionProps = {
  rows: IbRankingRow[];
  className?: string;
};

export function IbRankingSection({ rows, className = "" }: IbRankingSectionProps) {
  return (
    <DataPanel
      className={className}
      title={<h2 className="text-xl font-semibold text-white">IB Ranking</h2>}
    >
      <IbRankingTable rows={rows} />
    </DataPanel>
  );
}
