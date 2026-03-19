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
              <th className="py-2 pr-4 font-medium">Total Rebate</th>
              <th className="py-2 pr-4 font-medium">Traders</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ib_id} className="border-b last:border-0">
                <td className="py-2 pr-4">{row.ib_id}</td>
                <td className="py-2 pr-4">{row.ib_name}</td>
                <td className="py-2 pr-4">{row.total_rebate.toLocaleString()}</td>
                <td className="py-2 pr-4">{row.trader_count}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  No IB ranking records.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
