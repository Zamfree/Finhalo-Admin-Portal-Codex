export default function FinanceLedgerPage() {
  const records = [
    { id: "LDG-1001", type: "Commission", amount: "$1,245.00", status: "Completed" },
    { id: "LDG-1002", type: "Withdrawal", amount: "$320.00", status: "Pending" },
    { id: "LDG-1003", type: "Adjustment", amount: "$85.00", status: "Completed" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Review ledger activity and transaction records.
          </p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm">
          Export Ledger
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-4 flex gap-3">
          <input
            className="w-64 rounded-lg border px-3 py-2 text-sm"
            placeholder="Search record ID..."
          />
          <select className="rounded-lg border px-3 py-2 text-sm">
            <option>All Types</option>
            <option>Commission</option>
            <option>Withdrawal</option>
            <option>Adjustment</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-3">Record ID</th>
              <th className="py-3">Type</th>
              <th className="py-3">Amount</th>
              <th className="py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b">
                <td className="py-3">{record.id}</td>
                <td className="py-3">{record.type}</td>
                <td className="py-3">{record.amount}</td>
                <td className="py-3">{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
