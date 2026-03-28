"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";

import { uploadCommissionCsv } from "@/app/admin/commission/actions";

type ActionState = {
  error?: string;
  success?: string;
  batchId?: string;
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

type ParsedUploadRow = {
  user_id: string;
  account_number: string;
  symbol: string;
  volume: string;
  commission_amount: string;
  commission_date: string;
};

function parseDelimitedLine(line: string, delimiter: string): string[] {
  return line
    .split(delimiter)
    .map((value) => value.trim())
    .map((value) => value.replace(/^"|"$/g, ""));
}

function normalizeHeaderName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeCellValue(value: string | number | boolean | Date | null): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? "").trim();
}

function mapRawRowsToUploadRows(rawRows: string[][]): ParsedUploadRow[] {
  if (rawRows.length < 2) {
    throw new Error("File must include a header and at least one data row.");
  }

  const header = rawRows[0].map(normalizeHeaderName);
  const missing = REQUIRED_FIELDS.filter((field) => !header.includes(field));

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  const indexMap = new Map<string, number>(header.map((name, index) => [name, index]));
  const dataRows = rawRows
    .slice(1)
    .filter((columns) => columns.some((cell) => cell.trim().length > 0));

  if (dataRows.length === 0) {
    throw new Error("File must include at least one non-empty data row.");
  }

  return dataRows.map((columns) => {
    const get = (field: (typeof REQUIRED_FIELDS)[number]) =>
      (columns[indexMap.get(field) ?? -1] ?? "").trim();

    return {
      user_id: get("user_id"),
      account_number: get("account_number"),
      symbol: get("symbol"),
      volume: get("volume"),
      commission_amount: get("commission_amount"),
      commission_date: get("commission_date"),
    };
  });
}

function parseDelimitedText(text: string, delimiter: string): ParsedUploadRow[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\uFEFF/g, ""))
    .filter((line) => line.trim().length > 0)
    .map((line) => parseDelimitedLine(line, delimiter));

  return mapRawRowsToUploadRows(rows);
}

function parseExcelBuffer(arrayBuffer: ArrayBuffer): ParsedUploadRow[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true, raw: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Spreadsheet does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const sheetRows = XLSX.utils.sheet_to_json<Array<string | number | boolean | Date | null>>(
    worksheet,
    {
      header: 1,
      defval: "",
      raw: false,
    }
  );
  const normalizedRows = sheetRows.map((row) => row.map((value) => normalizeCellValue(value)));

  return mapRawRowsToUploadRows(normalizedRows);
}

async function parseUploadFile(file: File): Promise<ParsedUploadRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type.toLowerCase();

  if (extension === "csv" || mimeType === "text/csv") {
    return parseDelimitedText(await file.text(), ",");
  }

  if (extension === "tsv" || extension === "txt" || mimeType === "text/tab-separated-values") {
    return parseDelimitedText(await file.text(), "\t");
  }

  if (
    extension === "xlsx" ||
    extension === "xls" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return parseExcelBuffer(await file.arrayBuffer());
  }

  throw new Error("Unsupported file format. Use CSV, XLSX, XLS, or TSV.");
}

function toFiniteNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CsvUploadForm({ brokerOptions }: { brokerOptions: string[] }) {
  const [state, formAction, isPending] = useActionState(uploadCommissionCsv, INITIAL_STATE);
  const [broker, setBroker] = useState("");
  const [sourceFile, setSourceFile] = useState("");
  const [parseError, setParseError] = useState("");
  const [parsedPayload, setParsedPayload] = useState("[]");
  const [inspection, setInspection] = useState<UploadInspection | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = useMemo(
    () =>
      Boolean(broker.trim()) &&
      parsedPayload !== "[]" &&
      !parseError &&
      (inspection?.issueCount ?? 0) === 0,
    [broker, parsedPayload, parseError, inspection]
  );

  const batchReviewHref = state.batchId
    ? `/admin/commission?show_all=1&detail_batch_id=${encodeURIComponent(
        state.batchId
      )}&batch_drawer=overview`
    : "/admin/commission?show_all=1";

  function clearSelectedFile() {
    setParsedPayload("[]");
    setParseError("");
    setSourceFile("");
    setInspection(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      clearSelectedFile();
      return;
    }

    setSourceFile(file.name);
    let parsedRows: ParsedUploadRow[];

    try {
      parsedRows = await parseUploadFile(file);
    } catch (error) {
      setParsedPayload("[]");
      setInspection(null);
      setParseError(error instanceof Error ? error.message : "Failed to parse uploaded file.");
      return;
    }

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
          accountNumber: row.account_number || "-",
          symbol: row.symbol || "-",
          commissionDate: row.commission_date || "-",
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
      <h2 className="mb-4 text-base font-semibold text-white">Upload Commission File</h2>
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
            list="broker-options"
            value={broker}
            onChange={(event) => setBroker(event.target.value)}
            placeholder="Select or type broker name"
            className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
          <datalist id="broker-options">
            {brokerOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-zinc-500">Can type directly. Matching broker names will auto-suggest.</p>
        </div>

        <div>
          <label
            htmlFor="commission_csv"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Spreadsheet file
          </label>
          <input
            ref={fileInputRef}
            id="commission_csv"
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={onFileChange}
            className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-zinc-200 file:transition file:duration-200 hover:file:border-white/15 hover:file:bg-white/[0.08]"
          />
          {sourceFile ? (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="truncate pr-3 text-sm text-zinc-200">{sourceFile}</p>
              <button
                type="button"
                onClick={clearSelectedFile}
                className="admin-interactive inline-flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-zinc-300"
                aria-label="Clear selected file"
                title="Clear selected file"
              >
                x
              </button>
            </div>
          ) : null}
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-xs text-zinc-400">
            <p className="font-medium uppercase tracking-[0.08em] text-zinc-500">Required Field Example</p>
            <p className="mt-2">
              At minimum include: account_number (account), symbol, volume (lot size), and
              commission_date (time).
            </p>
            <p className="mt-1 font-mono text-zinc-300">
              account_number,symbol,volume,commission_date
            </p>
          </div>
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
                      <td className="py-2 pr-0 text-amber-200">{row.issues.join(" | ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {parseError ? <p className="text-sm text-rose-300">{parseError}</p> : null}
        {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
        {state.success ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <p>{state.success}</p>
            <p className="mt-1 text-emerald-300/90">
              Mapping and validation results can be reviewed in the batch queue.
            </p>
            <Link href={batchReviewHref} className="mt-2 inline-flex text-emerald-100 underline">
              Open batch review
            </Link>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Uploading..." : "Upload File"}
        </button>
      </form>
    </section>
  );
}
