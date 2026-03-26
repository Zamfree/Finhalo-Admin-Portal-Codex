"use client";

import { useActionState, useMemo, useState, type ChangeEvent } from "react";

import { uploadCommissionCsv } from "@/app/admin/commission/actions";

type ActionState = {
  error?: string;
  success?: string;
};

type UploadIssueRow = {
  rowNumber: number;
  accountNumber: string;
  symbol: string;
  commissionDate: string;
  issues: string[];
};

type UploadInspection = {
  rowCount: number;
  issueCount: number;
  duplicateCount: number;
  totalGrossCommission: number;
  issueRows: UploadIssueRow[];
};

const INITIAL_STATE: ActionState = {};
const REQUIRED_FIELDS = [
  "user_id",
  "account_number",
  "symbol",
  "volume",
  "commission_amount",
  "commission_date",
] as const;

function parseCsvLine(line: string): string[] {
  return line
    .split(",")
    .map((value) => value.trim())
    .map((value) => value.replace(/^"|"$/g, ""));
}

function toFiniteNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CsvUploadForm() {
  const [state, formAction, isPending] = useActionState(uploadCommissionCsv, INITIAL_STATE);
  const [broker, setBroker] = useState("");
  const [sourceFile, setSourceFile] = useState("");
  const [parseError, setParseError] = useState("");
  const [parsedPayload, setParsedPayload] = useState("[]");
  const [inspection, setInspection] = useState<UploadInspection | null>(null);

  const canSubmit = useMemo(
    () =>
      Boolean(broker.trim()) &&
      parsedPayload !== "[]" &&
      !parseError &&
      (inspection?.issueCount ?? 0) === 0,
    [broker, parsedPayload, parseError, inspection]
  );

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setParsedPayload("[]");
      setParseError("");
      setSourceFile("");
      setInspection(null);
      return;
    }

    setSourceFile(file.name);

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setParsedPayload("[]");
      setParseError("CSV must include a header and at least one data row.");
      setInspection(null);
      return;
    }

    const header = parseCsvLine(lines[0]);
    const missing = REQUIRED_FIELDS.filter((field) => !header.includes(field));

    if (missing.length > 0) {
      setParsedPayload("[]");
      setParseError(`Missing required fields: ${missing.join(", ")}`);
      setInspection(null);
      return;
    }

    const indexMap = new Map(header.map((name, index) => [name, index]));

    const parsedRows = lines.slice(1).map((line) => {
      const columns = parseCsvLine(line);
      const get = (field: (typeof REQUIRED_FIELDS)[number]) => columns[indexMap.get(field) ?? -1] ?? "";

      return {
        user_id: get("user_id"),
        account_number: get("account_number"),
        symbol: get("symbol"),
        volume: get("volume"),
        commission_amount: get("commission_amount"),
        commission_date: get("commission_date"),
      };
    });

    const duplicateMap = new Map<string, number>();
    let totalGrossCommission = 0;

    for (const row of parsedRows) {
      const duplicateKey = `${row.account_number}__${row.symbol}__${row.commission_date}`;
      duplicateMap.set(duplicateKey, (duplicateMap.get(duplicateKey) ?? 0) + 1);

      const commissionAmount = toFiniteNumber(row.commission_amount);
      if (commissionAmount !== null) {
        totalGrossCommission += commissionAmount;
      }
    }

    const issueRows = parsedRows.flatMap((row, index) => {
      const issues: string[] = [];

      for (const field of REQUIRED_FIELDS) {
        if (String(row[field]).trim().length === 0) {
          issues.push(`Missing ${field}`);
        }
      }

      if (toFiniteNumber(row.volume) === null) {
        issues.push("Invalid volume");
      }

      if (toFiniteNumber(row.commission_amount) === null) {
        issues.push("Invalid commission amount");
      }

      const duplicateKey = `${row.account_number}__${row.symbol}__${row.commission_date}`;
      if ((duplicateMap.get(duplicateKey) ?? 0) > 1) {
        issues.push("Duplicate record");
      }

      if (issues.length === 0) {
        return [];
      }

      return [
        {
          rowNumber: index + 2,
          accountNumber: row.account_number || "—",
          symbol: row.symbol || "—",
          commissionDate: row.commission_date || "—",
          issues,
        },
      ];
    });

    setParseError("");
    setParsedPayload(JSON.stringify(parsedRows));
    setInspection({
      rowCount: parsedRows.length,
      issueCount: issueRows.length,
      duplicateCount: issueRows.filter((row) => row.issues.includes("Duplicate record")).length,
      totalGrossCommission,
      issueRows,
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <h2 className="mb-4 text-base font-semibold text-white">Upload Commission CSV</h2>
      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="broker"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Broker
          </label>
          <input
            id="broker"
            name="broker"
            value={broker}
            onChange={(event) => setBroker(event.target.value)}
            placeholder="Broker name"
            className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>

        <div>
          <label
            htmlFor="commission_csv"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            CSV file
          </label>
          <input
            id="commission_csv"
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
            className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-zinc-200 file:transition file:duration-200 hover:file:border-white/15 hover:file:bg-white/[0.08]"
          />
        </div>

        <input type="hidden" name="parsed_csv" value={parsedPayload} />
        <input type="hidden" name="source_file" value={sourceFile} />

        {inspection ? (
          <div className="grid gap-3 rounded-2xl bg-white/[0.03] p-4 md:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Parsed Rows
              </p>
              <p className="mt-2 text-sm text-zinc-200">{inspection.rowCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Issue Rows
              </p>
              <p className="mt-2 text-sm text-zinc-200">{inspection.issueCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Gross Preview
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                {inspection.totalGrossCommission.toFixed(2)}
              </p>
            </div>
          </div>
        ) : null}

        {inspection && inspection.issueRows.length > 0 ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-amber-200">
                  Validation review required before upload.
                </p>
                <p className="mt-1 text-xs text-amber-300">
                  Resolve duplicate rows, missing values, or invalid numeric fields first.
                </p>
              </div>
              <p className="font-mono text-sm text-amber-200">
                {inspection.issueRows.length} issue rows
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-left text-sm">
                <thead>
                  <tr className="border-b border-amber-400/10">
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-amber-300">
                      Row
                    </th>
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-amber-300">
                      Account
                    </th>
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-amber-300">
                      Symbol
                    </th>
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-amber-300">
                      Date
                    </th>
                    <th className="py-2 pr-0 text-[11px] uppercase tracking-[0.12em] text-amber-300">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inspection.issueRows.slice(0, 12).map((row) => (
                    <tr
                      key={`${row.rowNumber}-${row.accountNumber}-${row.symbol}`}
                      className="border-b border-white/5"
                    >
                      <td className="py-2 pr-4 font-mono text-amber-100">{row.rowNumber}</td>
                      <td className="py-2 pr-4 font-mono text-zinc-200">{row.accountNumber}</td>
                      <td className="py-2 pr-4 text-zinc-200">{row.symbol}</td>
                      <td className="py-2 pr-4 font-mono text-zinc-300">{row.commissionDate}</td>
                      <td className="py-2 pr-0 text-amber-200">{row.issues.join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {parseError ? <p className="text-sm text-rose-300">{parseError}</p> : null}
        {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Uploading..." : "Upload CSV"}
        </button>
      </form>
    </section>
  );
}
