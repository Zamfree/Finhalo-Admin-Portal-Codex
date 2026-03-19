import Link from "next/link";

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
  return (
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">IB Ranking</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 pr-4 font-medium">IB ID</th>
              <th className="py-2 pr-4 font-medium">IB Name</th>
              <th className="py-2 pr-4 font-medium text-right">Total Rebate</th>
              <th className="py-2 pr-4 font-medium text-right">Traders</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ib_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="py-3 pr-4">
                  <Link href={`/admin/users/${row.ib_id}`} className="font-mono text-primary hover:underline">
                    {row.ib_id}
                  </Link>
                </td>
                <td className="py-3 pr-4 font-medium text-foreground">{row.ib_name ?? "Unknown IB"}</td>
                <td className="py-3 pr-4 text-right font-mono font-medium text-green-600">
                  ${(row.total_rebate ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 pr-4 text-right font-medium text-foreground">{(row.trader_count ?? 0).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted-foreground italic">
                  No IB ranking records found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
