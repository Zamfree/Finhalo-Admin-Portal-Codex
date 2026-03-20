import { DataTable } from "@/components/system/data/data-table";

type IbRankingRow = {
  ib_id: string;
  ib_name: string;
  total_rebate: number;
  trader_count: number;
};

type IbRankingTableProps = {
  rows: IbRankingRow[];
};

export function IbRankingTable({ rows }: IbRankingTableProps) {
  const columns = [
    {
      key: "ib_id",
      header: "IB ID",
      cell: (row: IbRankingRow) => row.ib_id,
      cellClassName: "py-4 pr-4 font-mono text-xs text-zinc-400",
    },
    {
      key: "ib_name",
      header: "IB Name",
      cell: (row: IbRankingRow) => row.ib_name,
      cellClassName: "py-4 pr-4 text-white",
    },
    {
      key: "total_rebate",
      header: "Total Rebate",
      cell: (row: IbRankingRow) => row.total_rebate.toLocaleString(),
      cellClassName: "py-4 pr-4 text-white",
    },
    {
      key: "trader_count",
      header: "Traders",
      cell: (row: IbRankingRow) => row.trader_count,
      cellClassName: "py-4 pr-4 text-white",
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.ib_id}
      minWidthClassName="min-w-[560px]"
    />
  );
}
