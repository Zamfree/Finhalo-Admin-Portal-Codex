"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { formatTruncatedNumber } from "@/lib/money-display";

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
  const columns: DataTableColumn<IbRankingRow>[] = [
    {
      key: "ib_id",
      header: "IB ID",
      cell: (row) => row.ib_id,
    },
    {
      key: "ib_name",
      header: "IB Name",
      cell: (row) => row.ib_name,
    },
    {
      key: "total_rebate",
      header: "Total Rebate",
      cell: (row) => formatTruncatedNumber(row.total_rebate),
      sortable: true,
      sortAccessor: (row) => row.total_rebate,
    },
    {
      key: "trader_count",
      header: "Traders",
      cell: (row) => row.trader_count,
      sortable: true,
      sortAccessor: (row) => row.trader_count,
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
