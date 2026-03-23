"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type IbRelationshipRow = {
  trader_id: string;
  l1_ib_id: string | null;
  l2_ib_id: string | null;
};

type IbRelationshipTableProps = {
  rows: IbRelationshipRow[];
};

const relationshipColumns: DataTableColumn<IbRelationshipRow>[] = [
  {
    key: "trader_id",
    header: "Trader",
    cell: (row) => row.trader_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-300",
    sortable: true,
    sortAccessor: (row) => row.trader_id,
  },
  {
    key: "l1_ib_id",
    header: "L1 (Parent IB)",
    cell: (row) => row.l1_ib_id ?? "-",
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-400",
    sortable: true,
    sortAccessor: (row) => row.l1_ib_id ?? "",
  },
  {
    key: "l2_ib_id",
    header: "L2 (Grand IB)",
    cell: (row) => row.l2_ib_id ?? "-",
    cellClassName: "py-3 pr-0 font-mono text-sm text-zinc-400",
    sortable: true,
    sortAccessor: (row) => row.l2_ib_id ?? "",
  },
];

export function IbRelationshipTable({ rows }: IbRelationshipTableProps) {
  return (
    <DataTable
      columns={relationshipColumns}
      rows={rows}
      getRowKey={(row) => row.trader_id}
      minWidthClassName="min-w-[720px]"
    />
  );
}