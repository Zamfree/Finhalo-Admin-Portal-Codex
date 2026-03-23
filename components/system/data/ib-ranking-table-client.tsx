"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type IbRankingRow = {
  id: string;
  ib_user_id: string;
  ib_email: string;
  total_clients: number;
  total_lots: number;
  total_rebate: number;
};

type IbRankingTableClientProps = {
  rows: IbRankingRow[];
};

const columns: DataTableColumn<IbRankingRow>[] = [
  {
    key: "ib_user_id",
    header: "IB User ID",
    cell: (row) => row.ib_user_id,
  },
  {
    key: "ib_email",
    header: "Email",
    cell: (row) => row.ib_email,
  },
  {
    key: "total_clients",
    header: "Clients",
    cell: (row) => row.total_clients,
    sortable: true,
    sortAccessor: (row) => row.total_clients,
  },
  {
    key: "total_lots",
    header: "Lots",
    cell: (row) => row.total_lots,
    sortable: true,
    sortAccessor: (row) => row.total_lots,
  },
  {
    key: "total_rebate",
    header: "Rebate",
    cell: (row) => row.total_rebate,
    sortable: true,
    sortAccessor: (row) => row.total_rebate,
  },
];

export function IbRankingTableClient({ rows }: IbRankingTableClientProps) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      minWidthClassName="min-w-[900px]"
    />
  );
}