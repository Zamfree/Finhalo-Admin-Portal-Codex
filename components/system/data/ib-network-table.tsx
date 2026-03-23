"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type IbNetworkRow = {
  trader_id: string;
  trader_email: string;
  level: number;
  total_rebate: number;
};

type IbNetworkTableProps = {
  rows: IbNetworkRow[];
};

const columns: DataTableColumn<IbNetworkRow>[] = [
  {
    key: "trader_email",
    header: "Trader",
    cell: (row) => row.trader_email,
    sortable: true,
    sortAccessor: (row) => row.trader_email,
  },
  {
    key: "level",
    header: "Level",
    cell: (row) => row.level,
    sortable: true,
    sortAccessor: (row) => row.level,
  },
  {
    key: "total_rebate",
    header: "Total Rebate",
    cell: (row) => row.total_rebate.toLocaleString(),
    sortable: true,
    sortAccessor: (row) => row.total_rebate,
  },
];

export function IbNetworkTable({ rows }: IbNetworkTableProps) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.trader_id}
    />
  );
}