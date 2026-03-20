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
    <section className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">IB Ranking</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-zinc-500">
              <th className="py-2 pr-4 font-medium">IB ID</th>
              <th className="py-2 pr-4 font-medium">IB Name</th>
              <th className="py-2 pr-4 font-medium">Total Rebate</th>
              <th className="py-2 pr-4 font-medium">Traders</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ib_id} className="border-b border-white/5 text-zinc-200 last:border-0">
                <td className="py-3 pr-4 font-mono text-xs">{row.ib_id}</td>
                <td className="py-3 pr-4">{row.ib_name}</td>
                <td className="py-3 pr-4">{row.total_rebate.toLocaleString()}</td>
                <td className="py-3 pr-4">{row.trader_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
